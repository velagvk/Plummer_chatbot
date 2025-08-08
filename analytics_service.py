import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Type, List, Optional
import os
import io
from dotenv import load_dotenv

# Use langchain's specific AzureChatOpenAI
from langchain_openai import AzureChatOpenAI
from langchain.agents.agent_types import AgentType
from langchain_experimental.agents import create_pandas_dataframe_agent

# --- Load Environment Variables ---
load_dotenv()

# --- Initialize FastAPI App ---
app = FastAPI(
    title="Advanced IT Ticket Analytics Service",
    description="An API service that uses a two-step LLM process to analyze IT tickets.",
)

# --- Pydantic Models for API Validation ---
class HistoryMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str
    history: Optional[List[HistoryMessage]] = None
    user_role: Optional[str] = None
    user_email: Optional[str] = None

class QueryResponse(BaseModel):
    result: str

# --- Load DataFrame and Initialize LLM ---
try:
    df = pd.read_csv('IT-Tickets-v1.csv')
    print("IT-Tickets-v1.csv loaded successfully.")
except FileNotFoundError:
    print("FATAL ERROR: IT-Tickets-v1.csv not found. The service cannot start.")
    df = None

# Initialize Azure OpenAI LLM for the Agent
# This will be used to generate the pandas query
llm_agent = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
    temperature=0,
    verbose=True
) if df is not None else None

# Initialize a separate LLM for summarization. Can be the same model.
# This is used to interpret the raw data from pandas into a human-friendly response.
llm_summarizer = AzureChatOpenAI(
    azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
    temperature=0.1,
    verbose=True
) if df is not None else None


# --- Define the Detailed Prompt for the Agent ---
AGENT_PREFIX = """
You are a helpful AI assistant working with a pandas dataframe named `df`.
Your primary goal is to formulate and execute a SINGLE, PRECISE Python query on `df` to answer the user's question.

RULES:
- You have access to a pandas DataFrame named 'df'.
- Use the provided column descriptions to understand the data.
- Your output MUST be the direct result of the pandas query. Do not provide any conversational text or explanation.
- IMPORTANT: When working with date columns, always convert them to datetime objects using pd.to_datetime() before sorting or comparing.

COLUMNS (exactly as present in df):
- "ID": Unique numeric identifier for each ticket.
- "Ticket Title": Short summary of the support request.
- "Support_Request": Full, detailed description of the user's issue.
- "Ticket_Type": Category of the ticket (e.g., "Technical Support", "HR Onboarding").
- "Status": The current state of the ticket.
- "Created Date": Ticket creation timestamp stored as a STRING date. Convert with pd.to_datetime() for any date operations.
- "CreatedBy": Full name of the person who created the ticket.
- "CreatedEmail": Email address of the person who created the ticket.
- "Assigned To": The technician or team the ticket is assigned to.
- "Closed Date": Ticket closed timestamp stored as a STRING date. Convert with pd.to_datetime() for any date operations.
- "Priority": Priority level of the ticket (e.g., "1 - Critical", "4 - Normal").
- "Resolution days": The number of days taken to resolve the ticket. If this value is missing, compute it as (Closed Date - Created Date).dt.days for closed tickets.

DATE USAGE EXAMPLES:
- Sort by creation date:
    df.assign(Created_dt=pd.to_datetime(df['Created Date'], errors='coerce')).sort_values('Created_dt')
- Average resolution days (using column directly when available):
    df.loc[df['Resolution days'].notna(), 'Resolution days'].mean()
- Average resolution days (computing missing values from dates when needed):
    tmp = df.assign(
        Created_dt=pd.to_datetime(df['Created Date'], errors='coerce'),
        Closed_dt=pd.to_datetime(df['Closed Date'], errors='coerce')
    )
    (tmp['Resolution days'].fillna((tmp['Closed_dt'] - tmp['Created_dt']).dt.days)).mean()
"""

# --- Create the LangChain Agent ---
agent = create_pandas_dataframe_agent(
    llm_agent,
    df,
    agent_type=AgentType.OPENAI_FUNCTIONS,
    prefix=AGENT_PREFIX,
    verbose=True,
    allow_dangerous_code=True,  # Required for pandas agent to execute code
) if df is not None else None

# --- Main Functions for Analysis Logic ---
def filter_dataframe_by_role(df_original: pd.DataFrame, user_role: str, user_email: str) -> pd.DataFrame:
    """
    Filter the dataframe based on user role and permissions.
    
    Args:
        df_original: The original dataframe
        user_role: The user's role ('IT Admin', 'Leadership', 'Normal User')
        user_email: The user's email address
    
    Returns:
        Filtered dataframe based on role permissions
    """
    if user_role in ['IT Admin', 'Leadership']:
        # IT Admin and Leadership can see all tickets
        return df_original.copy()
    elif user_role == 'Normal User':
        # Normal users can only see tickets they created
        # Filter by CreatedEmail or CreatedBy columns
        if 'CreatedEmail' in df_original.columns:
            filtered_df = df_original[df_original['CreatedEmail'] == user_email].copy()
        elif 'CreatedBy' in df_original.columns:
            # If no email match, try to match by name (less reliable)
            filtered_df = df_original[df_original['CreatedBy'].str.contains(user_email.split('@')[0], case=False, na=False)].copy()
        else:
            # No matching columns found, return empty dataframe
            filtered_df = df_original.iloc[0:0].copy()
        
        return filtered_df
    else:
        # Unknown role, return empty dataframe for security
        return df_original.iloc[0:0].copy()

def get_summarization_prompt(user_query: str, agent_response: str, history: Optional[List[HistoryMessage]]) -> str:
    history_context = ""
    if history:
        formatted_history = "\n".join([f"{turn.role}: {turn.content}" for turn in history])
        history_context = f"Previous conversation turns:\n{formatted_history}\n\n"

    return f"""
{history_context}User's current question: "{user_query}"

Raw data retrieved from the database based on the question:
---
{agent_response}
---

Your task is to act as a data interpreter. Based on the user's question and the retrieved data, provide a clear, natural language answer.
- If the user asks for a list or "how many", present the data clearly.
- If the user asks for details about a specific ticket, summarize the key information from the data into a readable paragraph.
- If the data is a single number or a simple fact, state it clearly.
- Do not just repeat the raw data if a summary is more appropriate.

Provide the most helpful response to the user:
"""

# --- API Endpoint Definition ---
@app.post("/analyze", response_model=QueryResponse)
async def analyze_data(request: QueryRequest):
    if df is None or llm_agent is None or llm_summarizer is None:
        raise HTTPException(status_code=503, detail="Analytics service is unavailable due to a configuration error (e.g., missing data file or API keys).")

    query = request.query
    history = request.history
    user_role = request.user_role or "Normal User"
    user_email = request.user_email or "unknown@example.com"
    
    print(f"Received query: {query}")
    print(f"User role: {user_role}, User email: {user_email}")

    try:
        # Step 1: Filter the dataframe based on user role
        filtered_df = filter_dataframe_by_role(df, user_role, user_email)
        
        # Check if user has access to any data
        if filtered_df.empty:
            if user_role == 'Normal User':
                return {"result": "I don't have access to information about tickets raised by others. I can only provide analytics for tickets that you have created. Please ensure you're asking about your own tickets."}
            else:
                return {"result": "No data found matching your query criteria."}
        
        print(f"Filtered dataframe has {len(filtered_df)} rows for {user_role}")
        
        # Step 2: Create a temporary agent with the filtered dataframe
        temp_agent = create_pandas_dataframe_agent(
            llm_agent,
            filtered_df,
            agent_type=AgentType.OPENAI_FUNCTIONS,
            prefix=AGENT_PREFIX,
            verbose=True,
            allow_dangerous_code=True,
        )
        
        # Step 3: Get the raw data using the pandas agent with filtered data
        agent_response = await temp_agent.ainvoke({"input": query})
        raw_data_output = agent_response.get("output", "No data found.")
        print(f"Agent raw output: {raw_data_output}")

        # Step 4: Use a second LLM call to summarize/interpret the raw data
        summarization_prompt = get_summarization_prompt(query, raw_data_output, history)
        
        summary_messages = [{"role": "user", "content": summarization_prompt}]
        completion = await llm_summarizer.ainvoke(summary_messages)
        
        final_response = completion.content.strip()
        print(f"Summarized response: {final_response}")

        return {"result": final_response}

    except Exception as e:
        print(f"An error occurred during query execution: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while analyzing your request: {e}")

# To run: uvicorn analytics_service:app --reload --port 5001 
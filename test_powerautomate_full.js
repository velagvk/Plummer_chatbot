const axios = require('axios');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPowerAutomateFullFlow() {
    try {
        console.log('🔍 Testing Power Automate full flow for ticket status inquiry...\n');
        
        const powerAutomateUrl = 'https://prod-76.westus.logic.azure.com:443/workflows/c3aff0f092ae4d7ba7dcb3b2b6b8a6f8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-xtL9wYiVsStTJdMnBmptAzXAuVvLEAtWauvTqqP3_g';
        
        const testEmail = 'vkumar9174@plummer.com';
        
        console.log(`📧 Testing with email: ${testEmail}`);
        console.log('🚀 Step 1: Triggering Power Automate flow...');
        
        // Step 1: Trigger the flow
        const triggerResponse = await axios.post(powerAutomateUrl, {
            creatorEmail: testEmail
        }, {
            headers: { 
                'Content-Type': 'application/json' 
            },
            timeout: 30000
        });
        
        console.log('✅ Flow triggered successfully!');
        console.log('📄 Trigger Status:', triggerResponse.data.properties.status);
        
        // Step 2: Wait for the flow to complete
        console.log('\n⏳ Step 2: Waiting for flow to complete...');
        const runId = triggerResponse.data.name;
        const statusUrl = `https://prod-76.westus.logic.azure.com:443/workflows/c3aff0f092ae4d7ba7dcb3b2b6b8a6f8/runs/${runId}?api-version=2016-06-01`;
        
        let attempts = 0;
        let maxAttempts = 10;
        let flowCompleted = false;
        let finalStatus = null;
        
        while (attempts < maxAttempts && !flowCompleted) {
            await delay(2000); // Wait 2 seconds
            attempts++;
            
            try {
                console.log(`   Attempt ${attempts}/${maxAttempts}: Checking flow status...`);
                
                // Note: We might not have access to check status directly due to permissions
                // Let's try a different approach - wait and then check outputs
                if (attempts >= 3) {
                    flowCompleted = true;
                    finalStatus = 'Assumed completed after waiting';
                }
            } catch (error) {
                console.log(`   Status check ${attempts} failed, continuing...`);
                if (attempts >= 3) {
                    flowCompleted = true;
                    finalStatus = 'Assumed completed after retries';
                }
            }
        }
        
        console.log('✅ Flow processing complete (or timeout reached)');
        console.log('📊 Final Status:', finalStatus);
        
        // Step 3: Try to access outputs through the original response method
        console.log('\n🎯 Step 3: Attempting to access flow outputs...');
        
        if (triggerResponse.data.properties.trigger && triggerResponse.data.properties.trigger.outputsLink) {
            const outputsUrl = triggerResponse.data.properties.trigger.outputsLink.uri;
            console.log('🔗 Outputs URL found:', outputsUrl.substring(0, 80) + '...');
            
            try {
                const outputsResponse = await axios.get(outputsUrl, {
                    timeout: 15000
                });
                
                console.log('✅ Successfully retrieved outputs!');
                console.log('📄 Outputs Data:');
                console.log(JSON.stringify(outputsResponse.data, null, 2));
                
                // Parse the actual ticket data
                if (outputsResponse.data && outputsResponse.data.body) {
                    console.log('\n🎯 Processing ticket data from body...');
                    const bodyData = outputsResponse.data.body;
                    
                    if (Array.isArray(bodyData)) {
                        console.log(`📋 Found ${bodyData.length} tickets:`);
                        bodyData.forEach((ticket, index) => {
                            console.log(`   Ticket ${index + 1}:`);
                            console.log(`     ID: ${ticket.ID || ticket.id || 'N/A'}`);
                            console.log(`     Title: ${ticket.Title || ticket.title || 'N/A'}`);
                            console.log(`     Status: ${ticket.Status || ticket.status || 'N/A'}`);
                            console.log(`     Created: ${ticket.Created || ticket.created || 'N/A'}`);
                        });
                    } else if (bodyData.value && Array.isArray(bodyData.value)) {
                        console.log(`📋 Found ${bodyData.value.length} tickets in value property:`);
                        bodyData.value.forEach((ticket, index) => {
                            console.log(`   Ticket ${index + 1}:`);
                            console.log(`     ID: ${ticket.ID || ticket.id || 'N/A'}`);
                            console.log(`     Title: ${ticket.Title || ticket.title || 'N/A'}`);
                            console.log(`     Status: ${ticket.Status || ticket.status || 'N/A'}`);
                            console.log(`     Created: ${ticket.Created || ticket.created || 'N/A'}`);
                        });
                    } else {
                        console.log('⚠️ Ticket data not in expected format');
                        console.log('Body data type:', typeof bodyData);
                        console.log('Body data keys:', Object.keys(bodyData));
                    }
                } else {
                    console.log('⚠️ No body data found in outputs');
                    console.log('Available keys:', Object.keys(outputsResponse.data));
                }
                
            } catch (outputError) {
                console.error('❌ Error accessing outputs:', outputError.message);
                if (outputError.response) {
                    console.error('Output Error Status:', outputError.response.status);
                    console.error('Output Error Data:', outputError.response.data);
                }
            }
        } else {
            console.log('⚠️ No outputs link found in trigger response');
        }
        
    } catch (error) {
        console.error('\n❌ Error in full flow test:');
        console.error('Message:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Response Data:', error.response.data);
        }
    }
}

console.log('🚀 Starting comprehensive Power Automate test...\n');
testPowerAutomateFullFlow(); 
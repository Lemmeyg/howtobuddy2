const ASSEMBLY_API_KEY = 'b77036dc33a1497abd2549fc5b752024';
const ASSEMBLY_API_URL = 'https://api.assemblyai.com/v2';

async function testAssemblyAI() {
  try {
    // Test with the Canadian wildfires audio sample
    const audioUrl = 'https://raw.githubusercontent.com/AssemblyAI-Community/audio-examples/main/20230607_me_canadian_wildfires.mp3';
    
    console.log('Submitting transcription request...');
    const submitResponse = await fetch(`${ASSEMBLY_API_URL}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': ASSEMBLY_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl
      })
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      throw new Error(`Failed to submit transcription: ${JSON.stringify(error)}`);
    }

    const { id: transcriptionId } = await submitResponse.json();
    console.log(`Transcription submitted successfully. ID: ${transcriptionId}`);

    // Poll for completion
    console.log('Checking transcription status...');
    while (true) {
      const statusResponse = await fetch(`${ASSEMBLY_API_URL}/transcript/${transcriptionId}`, {
        headers: {
          'Authorization': ASSEMBLY_API_KEY
        }
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(`Failed to check status: ${JSON.stringify(error)}`);
      }

      const transcription = await statusResponse.json();
      console.log(`Status: ${transcription.status}`);

      if (transcription.status === 'completed') {
        console.log('Transcription completed!');
        console.log('Text:', transcription.text);
        break;
      } else if (transcription.status === 'error') {
        throw new Error(`Transcription failed: ${transcription.error}`);
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAssemblyAI(); 
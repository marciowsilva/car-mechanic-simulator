// testar-modelos.js - Testa se os modelos 3D carregam

async function testarModelos() {
    console.log('=================================');
    console.log('🚗 TESTANDO MODELOS 3D');
    console.log('=================================');
    
    const modelos = [
        'sedan.glb',
        'hatch.glb', 
        'suv.glb',
        'pickup.glb',
        'sports.glb',
        'classic.glb'
    ];
    
    for (const modelo of modelos) {
        const caminho = `../assets/models/cars/${modelo}`;
        try {
            const response = await fetch(caminho);
            if (response.ok) {
                const tamanho = response.headers.get('content-length');
                console.log(`✅ ${modelo}: OK (${tamanho} bytes)`);
            } else {
                console.log(`❌ ${modelo}: ERRO ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${modelo}: FALHOU - ${error.message}`);
        }
    }
}

testarModelos();
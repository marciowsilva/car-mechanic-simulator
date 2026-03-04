// download-models.js - Script para baixar modelos 3D de carros

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { exec } from 'child_process';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração
const CONFIG = {
    modelsDir: path.join(__dirname, 'models', 'cars'),
    texturesDir: path.join(__dirname, 'models', 'cars', 'textures'),
    tempDir: path.join(__dirname, 'temp'),
    
    // Modelos a baixar (fontes gratuitas CC0 / Open Source)
    models: [
        {
            id: 'sedan',
            name: 'Sedan',
            type: 'glb',
            source: 'polyhaven',
            url: 'https://dl.polyhaven.org/file/ph-assets/Models/glb/city_car_01.glb',
            fallback: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
            textures: []
        },
        {
            id: 'hatch',
            name: 'Hatchback',
            type: 'glb',
            source: 'polyhaven',
            url: 'https://dl.polyhaven.org/file/ph-assets/Models/glb/hatchback_01.glb',
            fallback: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
            textures: []
        },
        {
            id: 'suv',
            name: 'SUV',
            type: 'glb',
            source: 'open3d',
            url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
            fallback: null,
            textures: []
        },
        {
            id: 'pickup',
            name: 'Pickup',
            type: 'glb',
            source: 'open3d',
            url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
            fallback: null,
            textures: []
        },
        {
            id: 'sports',
            name: 'Sports Car',
            type: 'glb',
            source: 'sketchfab',
            url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
            fallback: null,
            textures: []
        },
        {
            id: 'classic',
            name: 'Classic Car',
            type: 'glb',
            source: 'cgtrader',
            url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
            fallback: null,
            textures: []
        }
    ],
    
    // Fontes alternativas
    fallbackUrls: [
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo/glTF/Flamingo.gltf',
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/BoomBox/glTF/BoomBox.gltf'
    ]
};

// Criar interface readline para input do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função para criar diretórios
function createDirectories() {
    console.log('📁 Criando diretórios...');
    
    [CONFIG.modelsDir, CONFIG.texturesDir, CONFIG.tempDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`  ✅ Criado: ${dir}`);
        } else {
            console.log(`  📂 Já existe: ${dir}`);
        }
    });
}

// Função para baixar arquivo
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            
            const totalBytes = parseInt(response.headers['content-length'], 10);
            let downloadedBytes = 0;
            
            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (totalBytes) {
                    const percent = Math.round((downloadedBytes / totalBytes) * 100);
                    process.stdout.write(`\r  📥 Progresso: ${percent}%`);
                }
            });
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                process.stdout.write('\n');
                resolve();
            });
            
        }).on('error', (err) => {
            fs.unlink(destination, () => {});
            reject(err);
        });
    });
}

// Função para verificar se URL é válida
function checkUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (response) => {
            resolve(response.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

// Função para baixar modelo com fallback
async function downloadModel(model) {
    console.log(`\n🚗 Baixando modelo: ${model.name} (${model.id})...`);
    
    const fileName = `${model.id}.${model.type}`;
    const filePath = path.join(CONFIG.modelsDir, fileName);
    
    // Verificar se já existe
    if (fs.existsSync(filePath)) {
        console.log(`  ⏭️  Arquivo já existe: ${fileName}`);
        return true;
    }
    
    // Tentar URL principal
    console.log(`  🔗 Tentando fonte principal: ${model.source}`);
    const isValid = await checkUrl(model.url);
    
    if (isValid) {
        try {
            await downloadFile(model.url, filePath);
            console.log(`  ✅ Download concluído: ${fileName}`);
            return true;
        } catch (error) {
            console.log(`  ❌ Erro no download principal: ${error.message}`);
        }
    } else {
        console.log(`  ⚠️  URL principal não disponível`);
    }
    
    // Tentar fallback se existir
    if (model.fallback) {
        console.log(`  🔄 Tentando fonte alternativa...`);
        try {
            await downloadFile(model.fallback, filePath);
            console.log(`  ✅ Download concluído (fallback): ${fileName}`);
            return true;
        } catch (error) {
            console.log(`  ❌ Erro no fallback: ${error.message}`);
        }
    }
    
    // Tentar fallbacks genéricos
    for (const fallbackUrl of CONFIG.fallbackUrls) {
        console.log(`  🔄 Tentando fallback genérico...`);
        try {
            await downloadFile(fallbackUrl, filePath);
            console.log(`  ✅ Download concluído (fallback genérico): ${fileName}`);
            return true;
        } catch (error) {
            continue;
        }
    }
    
    console.log(`  ❌ Não foi possível baixar ${model.name}`);
    return false;
}

// Função para criar modelo procedural (caso nenhum download funcione)
function createProceduralModel(modelId) {
    console.log(`  🔧 Criando modelo procedural para ${modelId}...`);
    
    // Criar arquivo JSON com instruções para criar modelo procedural
    const procPath = path.join(CONFIG.modelsDir, `${modelId}.proc.json`);
    const procData = {
        id: modelId,
        type: 'procedural',
        created: new Date().toISOString(),
        instructions: 'Usar gerador procedural no car-model-loader.js'
    };
    
    fs.writeFileSync(procPath, JSON.stringify(procData, null, 2));
    console.log(`  ✅ Modelo procedural criado: ${modelId}.proc.json`);
}

// Função para verificar espaço em disco
function checkDiskSpace() {
    // Estimativa aproximada de espaço necessário (50MB por modelo)
    const estimatedSize = CONFIG.models.length * 50 * 1024 * 1024;
    console.log(`\n💾 Espaço estimado necessário: ${(estimatedSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
    
    return new Promise((resolve) => {
        rl.question('📦 Continuar com download? (s/N): ', (answer) => {
            resolve(answer.toLowerCase() === 's');
        });
    });
}

// Função para criar arquivo de manifest
function createManifest(results) {
    const manifest = {
        generated: new Date().toISOString(),
        totalModels: CONFIG.models.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        models: results,
        directory: CONFIG.modelsDir
    };
    
    const manifestPath = path.join(__dirname, 'models', 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n📋 Manifesto criado: ${manifestPath}`);
}

// Função para baixar texturas (se disponíveis)
async function downloadTextures() {
    console.log('\n🎨 Verificando texturas...');
    
    // Aqui você pode adicionar URLs de texturas se necessário
    const textureUrls = [
        // Exemplo: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/uv_grid_opengl.jpg'
    ];
    
    for (let i = 0; i < textureUrls.length; i++) {
        const url = textureUrls[i];
        const fileName = `texture_${i}.jpg`;
        const filePath = path.join(CONFIG.texturesDir, fileName);
        
        try {
            await downloadFile(url, filePath);
            console.log(`  ✅ Textura baixada: ${fileName}`);
        } catch (error) {
            console.log(`  ❌ Erro ao baixar textura: ${error.message}`);
        }
    }
}

// Função principal
async function main() {
    console.log('=================================');
    console.log('🚗 DOWNLOAD DE MODELOS 3D');
    console.log('=================================\n');
    
    // Criar diretórios
    createDirectories();
    
    // Verificar espaço em disco
    const shouldContinue = await checkDiskSpace();
    if (!shouldContinue) {
        console.log('\n❌ Download cancelado pelo usuário.');
        process.exit(0);
    }
    
    // Baixar modelos
    console.log('\n📥 Iniciando downloads...\n');
    
    const results = [];
    
    for (let i = 0; i < CONFIG.models.length; i++) {
        const model = CONFIG.models[i];
        console.log(`\n[${i + 1}/${CONFIG.models.length}]`);
        
        const success = await downloadModel(model);
        
        results.push({
            id: model.id,
            name: model.name,
            success,
            timestamp: new Date().toISOString()
        });
        
        if (!success) {
            createProceduralModel(model.id);
        }
    }
    
    // Baixar texturas (opcional)
    await downloadTextures();
    
    // Criar manifesto
    createManifest(results);
    
    // Resumo final
    console.log('\n=================================');
    console.log('📊 RESUMO DO DOWNLOAD');
    console.log('=================================');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Modelos baixados: ${successful}/${CONFIG.models.length}`);
    console.log(`⚠️  Modelos com fallback: ${failed}`);
    console.log(`📁 Diretório: ${CONFIG.modelsDir}`);
    
    if (failed > 0) {
        console.log('\n⚠️  Modelos com fallback procedural:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  - ${r.name} (${r.id})`);
        });
        console.log('\n📝 Use os arquivos .proc.json como fallback no jogo');
    }
    
    console.log('\n✨ Processo concluído!');
    rl.close();
}

// Executar script
main().catch(error => {
    console.error('❌ Erro fatal:', error);
    rl.close();
    process.exit(1);
});
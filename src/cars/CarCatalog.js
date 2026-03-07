// src/cars/CarCatalog.js - Catálogo completo de carros

export const CarCatalog = {
    // Carros compactos (fáceis de reparar)
    compact: [
        {
            id: 'fiat_uno',
            brand: 'Fiat',
            model: 'Uno',
            year: 2015,
            type: 'compact',
            engineSize: '1.0',
            difficulty: 'easy',
            basePrice: 8000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador'],
            image: '🏎️'
        },
        {
            id: 'vw_gol',
            brand: 'Volkswagen',
            model: 'Gol',
            year: 2016,
            type: 'compact',
            engineSize: '1.0',
            difficulty: 'easy',
            basePrice: 8500,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador'],
            image: '🚗'
        },
        {
            id: 'chevrolet_onix',
            brand: 'Chevrolet',
            model: 'Onix',
            year: 2017,
            type: 'compact',
            engineSize: '1.0',
            difficulty: 'easy',
            basePrice: 9000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador'],
            image: '🚙'
        }
    ],

    // Carros sedans (médios)
    sedan: [
        {
            id: 'toyota_corolla',
            brand: 'Toyota',
            model: 'Corolla',
            year: 2018,
            type: 'sedan',
            engineSize: '2.0',
            difficulty: 'medium',
            basePrice: 25000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador'],
            image: '🚘'
        },
        {
            id: 'honda_civic',
            brand: 'Honda',
            model: 'Civic',
            year: 2017,
            type: 'sedan',
            engineSize: '2.0',
            difficulty: 'medium',
            basePrice: 24000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador'],
            image: '🚖'
        },
        {
            id: 'chevrolet_cruze',
            brand: 'Chevrolet',
            model: 'Cruze',
            year: 2018,
            type: 'sedan',
            engineSize: '1.8',
            difficulty: 'medium',
            basePrice: 22000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador'],
            image: '🚗'
        }
    ],

    // SUVs (difíceis)
    suv: [
        {
            id: 'jeep_renegade',
            brand: 'Jeep',
            model: 'Renegade',
            year: 2017,
            type: 'suv',
            engineSize: '1.8',
            difficulty: 'hard',
            basePrice: 35000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'diferencial'],
            image: '🚙'
        },
        {
            id: 'toyota_rav4',
            brand: 'Toyota',
            model: 'RAV4',
            year: 2018,
            type: 'suv',
            engineSize: '2.0',
            difficulty: 'hard',
            basePrice: 38000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'diferencial'],
            image: '🚐'
        },
        {
            id: 'honda_hrv',
            brand: 'Honda',
            model: 'HR-V',
            year: 2017,
            type: 'suv',
            engineSize: '1.8',
            difficulty: 'hard',
            basePrice: 36000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'diferencial'],
            image: '🚗'
        }
    ],

    // Carros esportivos (muito difíceis)
    sports: [
        {
            id: 'ford_mustang',
            brand: 'Ford',
            model: 'Mustang',
            year: 2018,
            type: 'sports',
            engineSize: '5.0',
            difficulty: 'extreme',
            basePrice: 120000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'turbo', 'embreagem'],
            image: '🏎️'
        },
        {
            id: 'chevrolet_camaro',
            brand: 'Chevrolet',
            model: 'Camaro',
            year: 2017,
            type: 'sports',
            engineSize: '6.2',
            difficulty: 'extreme',
            basePrice: 115000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'turbo', 'embreagem'],
            image: '🚘'
        },
        {
            id: 'porsche_911',
            brand: 'Porsche',
            model: '911',
            year: 2018,
            type: 'sports',
            engineSize: '3.0',
            difficulty: 'extreme',
            basePrice: 250000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'turbo', 'embreagem'],
            image: '🏁'
        }
    ],

    // Carros de luxo
    luxury: [
        {
            id: 'mercedes_c300',
            brand: 'Mercedes-Benz',
            model: 'C300',
            year: 2018,
            type: 'luxury',
            engineSize: '2.0',
            difficulty: 'hard',
            basePrice: 85000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'sensor', 'eletronica'],
            image: '👑'
        },
        {
            id: 'bmw_330i',
            brand: 'BMW',
            model: '330i',
            year: 2017,
            type: 'luxury',
            engineSize: '2.0',
            difficulty: 'hard',
            basePrice: 82000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'sensor', 'eletronica'],
            image: '💎'
        },
        {
            id: 'audi_a4',
            brand: 'Audi',
            model: 'A4',
            year: 2018,
            type: 'luxury',
            engineSize: '2.0',
            difficulty: 'hard',
            basePrice: 78000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador', 'sensor', 'eletronica'],
            image: '✨'
        }
    ],

    // Carros clássicos (raros)
    classic: [
        {
            id: 'fusca_1970',
            brand: 'Volkswagen',
            model: 'Fusca',
            year: 1970,
            type: 'classic',
            engineSize: '1.3',
            difficulty: 'medium',
            basePrice: 45000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador'],
            image: '🐞'
        },
        {
            id: 'opala_1975',
            brand: 'Chevrolet',
            model: 'Opala',
            year: 1975,
            type: 'classic',
            engineSize: '4.1',
            difficulty: 'medium',
            basePrice: 55000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador'],
            image: '🚘'
        },
        {
            id: 'mustang_1969',
            brand: 'Ford',
            model: 'Mustang',
            year: 1969,
            type: 'classic',
            engineSize: '4.7',
            difficulty: 'hard',
            basePrice: 150000,
            parts: ['motor', 'transmissao', 'freios', 'suspensao', 'bateria', 'alternador', 'radiador'],
            image: '🏆'
        }
    ]
};

// Função para obter um carro aleatório por dificuldade
export function getRandomCar(difficulty = null) {
    let availableCars = [];
    
    if (difficulty) {
        // Filtrar por dificuldade
        Object.values(CarCatalog).forEach(category => {
            category.forEach(car => {
                if (car.difficulty === difficulty) {
                    availableCars.push(car);
                }
            });
        });
    } else {
        // Todos os carros
        Object.values(CarCatalog).forEach(category => {
            availableCars = availableCars.concat(category);
        });
    }
    
    if (availableCars.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableCars.length);
    return { ...availableCars[randomIndex] };
}

// Função para obter carro por ID
export function getCarById(carId) {
    for (const category of Object.values(CarCatalog)) {
        const car = category.find(c => c.id === carId);
        if (car) return { ...car };
    }
    return null;
}

// Exportar todas as categorias
export const CarCategories = Object.keys(CarCatalog);
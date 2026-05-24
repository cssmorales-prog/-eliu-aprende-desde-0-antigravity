/* ==========================================================================
   BASE DE DATOS CURRICULAR - 1° BÁSICO CHILE (MINEDUC)
   Integración específica con:
   - "Supermatemáticos 1" (Pág 56)
   - "Jugando con los Sonidos 3" (Pág 49)
   - "Caligrafía 1° Básico" (Pág 75)
   ========================================================================== */

const curriculumData = {
    // 📘 LENGUAJE Y COMUNICACIÓN (Jugando con los Sonidos & Caligrafía)
    lenguaje: {
        title: "Isla de las Letras",
        subjectName: "Lenguaje y Comunicación",
        color: "var(--color-lenguaje)",
        lightColor: "var(--color-lenguaje-light)",
        icon: "📘",
        lessons: [
            {
                id: "lenguaje_1",
                title: "Jugando con las Sílabas",
                bookRef: "Jugando con los Sonidos 3",
                basePage: 49,
                description: "¡Vamos a aplaudir y contar los trocitos de las palabras!",
                narrative: "¡Hola Eliu! Soy Eliubot, y hoy he traído a tu súper cachorro favorito: ¡Marshall de Paw Patrol! Marshall es bombero 🐕‍🚒 y doctor 🚑, y hoy nos ayudará en tu libro 'Jugando con los Sonidos 3', en la página 49. Nos enseñará a separar las palabras en trocitos que se llaman sílabas. ¡Es como contar las mangueras de agua en la estación! Cada sílaba es un aplauso o un ladridito de cachorro: ¡Guau! Por ejemplo, la palabra 'Plataforma' tiene cuatro aplausos: pla-ta-for-ma. ¡Hagamos unos aplausos juntos!",
                questions: [
                    {
                        type: "multiple",
                        prompt: "¿Cuántos trocitos (sílabas) tiene la palabra 'BOMBERO'? ¡Aplaude fuerte con Marshall! BOM - BE - RO.",
                        options: [
                            { text: "1 aplauso", correct: false },
                            { text: "2 aplausos", correct: false },
                            { text: "3 aplausos ¡Súper Guau, correcto! 🐕‍🚒", correct: true }
                        ],
                        synonymsExplain: "¡Excelente! Bombero tiene 3 sílabas, que son los 'trocitos' o 'partes' en las que dividimos la palabra al hablar."
                    },
                    {
                        type: "multiple",
                        prompt: "Encuentra la palabra que rima (suena igual al final) con 'MARSHALL' (tu cachorro bombero):",
                        options: [
                            { text: "Zapato", correct: false },
                            { text: "Avión", correct: false },
                            { text: "Estación ¡Súper Rima! 🚒", correct: true }
                        ],
                        synonymsExplain: "¡Eso! Marshall y Estación suenan muy bien juntos y riman porque terminan con un sonido similar de rescate."
                    }
                ]
            },
            {
                id: "lenguaje_2",
                title: "Trazando Letras Mágicas",
                bookRef: "Caligrafía 1° Básico",
                basePage: 75,
                description: "Aprende a trazar letras en la cuadrícula de triple renglón.",
                narrative: "¡Eliu, es hora de escribir! Marshall el bombero tiene su manguera roja lista. En la página 75 de tu cuaderno de 'Caligrafía', estamos trazando letras hermosas. Para escribir súper bien, imagina que la cuadrícula es una pista de rescate de Paw Patrol: ¡tiene cielo, pasto y tierra! La letra 'M' de Marshall sube al cielo y baja al pasto. ¡Usa tu pincel digital en el diario mágico para trazar la letra de Marshall!",
                isCaligrafia: true,
                letterToTrace: "M",
                questions: [
                    {
                        type: "multiple",
                        prompt: "¿Con qué letra de la Patrulla Canina empieza el nombre de tu cachorro favorito 'MARSHALL'?",
                        options: [
                            { text: "Con la letra L", correct: false },
                            { text: "Con la letra M ¡Maravilloso! ✍️", correct: true },
                            { text: "Con la letra S", correct: false }
                        ],
                        synonymsExplain: "¡Exacto! El nombre de Marshall comienza con M. La letra M también se conoce como la letra de 'Mamá' o 'Monito'."
                    }
                ]
            }
        ]
    },

    // 🔢 MATEMÁTICAS (Supermatemáticos 1)
    matematica: {
        title: "Isla de los Números",
        subjectName: "Matemática",
        color: "var(--color-matematica)",
        lightColor: "var(--color-matematica-light)",
        icon: "🔢",
        lessons: [
            {
                id: "matematica_1",
                title: "Super Bloques: Sumar es Juntar",
                bookRef: "Supermatemáticos 1",
                basePage: 56,
                description: "Suma y une bloques Roblox en la página 56.",
                narrative: "¡Eliu! Marshall el bombero necesita apagar un pequeño fuego de bloques en la página 56 de tu libro 'Supermatemáticos 1'. ¡Nos convertimos en súper constructores! Sumar significa 'juntar', 'reunir' o 'agregar' bloques de agua para apagar el incendio. Si Marshall tiene 5 bloques de agua rojos y Chase le regala 3 bloques azules, ¡hacemos una torre más alta! Vamos a contar cuántos bloques tenemos en total.",
                questions: [
                    {
                        type: "multiple",
                        prompt: "Marshall tiene 5 bloques de agua en su camión 🚒 y su amigo Chase le regala 3 bloques azules. ¿Cuántos bloques tiene si los 'JUNTO' todos?",
                        options: [
                            { text: "7 bloques", correct: false },
                            { text: "8 bloques ¡Eres un Supermatemático de Paw Patrol! 🏆", correct: true },
                            { text: "9 bloques", correct: false }
                        ],
                        synonymsExplain: "¡Excelente! 5 juntado con 3 nos da 8. Juntar es el sinónimo de 'sumar' o 'adicionar' bloques."
                    },
                    {
                        type: "multiple",
                        prompt: "Mira el patrón en los vehículos de rescate: 🚒 🚑 🚒 🚑 ¿Qué vehículo sigue ahora?",
                        options: [
                            { text: "Un helicóptero de Skye 🚁", correct: false },
                            { text: "Un camión de bomberos 🚒 ¡Súper bien!", correct: true },
                            { text: "Un auto de policía 🚓", correct: false }
                        ],
                        synonymsExplain: "¡Gran trabajo! El patrón se repite: camión de bomberos, ambulancia, camión, ambulancia... ¡así que sigue el camión de bomberos 🚒! Un patrón es un 'orden repetido' de elementos."
                    }
                ]
            }
        ]
    },

    // 🌿 CIENCIAS NATURALES
    ciencias: {
        title: "Isla de la Naturaleza",
        subjectName: "Ciencias Naturales",
        color: "var(--color-ciencias)",
        lightColor: "var(--color-ciencias-light)",
        icon: "🌿",
        lessons: [
            {
                id: "ciencias_1",
                title: "Mis Súper 5 Sentidos",
                bookRef: "Ciencias Naturales 1°",
                basePage: 15,
                description: "Explora cómo tu cuerpo siente el hermoso planeta Tierra.",
                narrative: "¡Hola Eliu! Hoy Marshall se viste de ¡Doctor Cachorro! 🚑 Marshall el doctor usa su estetoscopio y sus sensores para cuidar a sus amigos perritos en Bahía Aventura. ¡Tú tienes unos súper poderes corporales llamados los 5 Sentidos! Tus ojos sirven para VER, tus oídos para ESCUCHAR, tu nariz para OLER, tu lengua para SABOREAR y tus manos para TOCAR. Estos sentidos te ayudan a 'percibir' o 'descubrir' todo lo que te rodea. ¡Cuidar tu salud es cuidar tus sentidos!",
                questions: [
                    {
                        type: "multiple",
                        prompt: "¿Qué súper sentido usa Marshall el doctor con su estetoscopio para 'ESCUCHAR' los latidos del corazón de Chase?",
                        options: [
                            { text: "El sentido del Olfato 👃", correct: false },
                            { text: "El sentido del Oído 👂 ¡Espectacular Doctor! 💼", correct: true },
                            { text: "El sentido del Gusto 👅", correct: false }
                        ],
                        synonymsExplain: "¡Eso! El oído es el órgano del sentido de la audición, que nos sirve para escuchar, oír o registrar los sonidos."
                    },
                    {
                        type: "multiple",
                        prompt: "Los cachorros duermen de noche, pero algunos animales del sur de Chile cazan de noche. ¿Qué animal está despierto por la NOCHE?",
                        options: [
                            { text: "El Tucúquere (Búho grande de Chile) ¡Correcto! 🦉", correct: true },
                            { text: "La gallina", correct: false },
                            { text: "El perrito", correct: false }
                        ],
                        synonymsExplain: "¡Sí! El Tucúquere es una hermosa ave nocturna de Chile que tiene hábitos nocturnos (es decir, está despierto en la noche mientras tú duermes)."
                    }
                ]
            }
        ]
    },

    // 🗺️ HISTORIA, GEOGRAFÍA Y CIENCIAS SOCIALES
    historia: {
        title: "Isla de la Aventura",
        subjectName: "Historia, Geografía y Ciencias Sociales",
        color: "var(--color-historia)",
        lightColor: "var(--color-historia-light)",
        icon: "🗺️",
        lessons: [
            {
                id: "historia_1",
                title: "Mi País es Chile",
                bookRef: "Historia 1° Básico",
                basePage: 30,
                description: "Conoce los hermosos símbolos de nuestro país largo y angosto.",
                narrative: "¡Eliu! Hoy Marshall el bombero y doctor viaja en su camión de rescate por Chile, nuestro larguísimo y hermoso país. Chile parece una cintita larga al lado del Océano Pacífico, llena de montañas con nieve. Chile tiene símbolos patrios hermosos: nuestra Bandera tricolor (con una estrella blanca), el Copihue (nuestra flor roja con forma de campana) y el Escudo Nacional. ¡Acompaña a Marshall a explorar de norte a sur!",
                questions: [
                    {
                        type: "multiple",
                        prompt: "Marshall quiere pintar la estación de bomberos con los colores de la bandera de Chile. ¿Cuáles son?",
                        options: [
                            { text: "Amarillo, verde y café", correct: false },
                            { text: "Azul, blanco y rojo ¡Hermoso! 🇨🇱", correct: true },
                            { text: "Púrpura, rosado y negro", correct: false }
                        ],
                        synonymsExplain: "¡Así es! Nuestra hermosa bandera es azul como el cielo chileno, blanca como la cordillera nevada y roja como la flor del copihue."
                    },
                    {
                        type: "multiple",
                        prompt: "Si hoy es SÁBADO y salimos a jugar con el camión de bomberos de Marshall, ¿qué día fue AYER?",
                        options: [
                            { text: "Fue Viernes ¡Increíble! 🌟", correct: true },
                            { text: "Fue Domingo", correct: false },
                            { text: "Fue Lunes", correct: false }
                        ],
                        synonymsExplain: "¡Súper bien! Ayer fue Viernes. El tiempo corre ordenado en días de la semana: lunes, martes, miércoles, jueves, viernes, sábado y domingo."
                    }
                ]
            }
        ]
    }
};

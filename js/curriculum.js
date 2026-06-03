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
                title: "Secuencias Vocálicas (A-E-A)",
                bookRef: "Jugando con los Sonidos 3",
                basePage: 54,
                description: "¡Encuentra palabras que tengan la secuencia A - E - A!",
                narrative: "¡Hola Eliu! Soy Eliubot. Hoy en tu libro 'Jugando con los Sonidos 3', página 54, nos vamos de cacería de vocales con Chase. El patrón mágico de hoy es A - E - A. Así como en la palabra 'Ga-lle-ta'. ¡Guau! Tenemos que encontrar todas las palabras secretas que suenen igual de divertidas en su guatita vocálica.",
                questions: [
                    {
                        type: "multiple",
                        prompt: "Escucha bien: Ga-lle-ta (A - E - A). ¿Qué otra palabra tiene la misma secuencia vocálica?",
                        options: [
                            { text: "Mo-chi-la", correct: false },
                            { text: "Ba-lle-na ¡Guau, correcto! 🐳", correct: true },
                            { text: "Ca-mi-sa", correct: false }
                        ],
                        synonymsExplain: "¡Súper Guau! Ballena tiene las vocales a-e-a, ¡igualito que galleta!"
                    },
                    {
                        type: "multiple",
                        prompt: "¿Cuál de estas palabras también tiene el patrón mágico A - E - A?",
                        options: [
                            { text: "Ma-le-ta ¡Muy bien! 🧳", correct: true },
                            { text: "Ti-je-ra", correct: false },
                            { text: "Pe-lo-ta", correct: false }
                        ],
                        synonymsExplain: "¡Eso! Maleta también esconde el patrón A-E-A. Eres un súper investigador de sonidos."
                    }
                ]
            },
            {
                id: "lenguaje_2",
                title: "Trazando Palabras",
                bookRef: "Caligrafía 1° Básico",
                basePage: 90,
                description: "Aprende a trazar letras y palabras en la cuadrícula.",
                narrative: "¡Eliu, es hora de escribir! En la página 90 de tu cuaderno de 'Caligrafía', estamos trazando palabras súper importantes. Recuerda subir al cielo, bajar al pasto y, a veces, ¡tocar la tierra! Eres el mejor escribiendo.",
                isCaligrafia: true,
                letterToTrace: "palabras mágicas",
                questions: [
                    {
                        type: "multiple",
                        prompt: "Cuando escribimos con letra ligada (manuscrita), ¿qué hacemos con el lápiz?",
                        options: [
                            { text: "Lo levantamos a cada rato", correct: false },
                            { text: "Lo mantenemos en el papel sin soltarlo ¡Excelente! ✍️", correct: true }
                        ],
                        synonymsExplain: "¡Exacto! Al escribir juntito no levantamos el lápiz hasta terminar la palabra."
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
                title: "Super Restas: Quitar Bloques",
                bookRef: "Supermatemáticos 1",
                basePage: 59,
                description: "Resta y quita bloques en la página 59.",
                narrative: "¡Eliu! Marshall el bombero tiene una misión en la página 59 de tu libro 'Supermatemáticos 1'. ¡Hoy vamos a RESTAR! Restar significa 'quitar' o 'sacar' bloques. Si Marshall tiene 8 bloques de agua y usa 3 para apagar el fuego, ¡nos quedan menos bloques! Vamos a ver cuántos quedan.",
                questions: [
                    {
                        type: "multiple",
                        prompt: "Marshall tenía 8 bloques de agua 🚒 y usó 3 para apagar el fuego. ¿Cuántos bloques le 'QUEDAN'?",
                        options: [
                            { text: "4 bloques", correct: false },
                            { text: "5 bloques ¡Eres un Supermatemático! 🏆", correct: true },
                            { text: "6 bloques", correct: false }
                        ],
                        synonymsExplain: "¡Excelente! A 8 le quitamos 3 y nos quedan 5. Restar es el sinónimo de 'quitar' o 'sustraer'."
                    },
                    {
                        type: "multiple",
                        prompt: "Si tienes 10 bloques de Roblox y te quitan 4, ¿cuántos te quedan?",
                        options: [
                            { text: "6 bloques ¡Súper bien!", correct: true },
                            { text: "5 bloques", correct: false },
                            { text: "7 bloques", correct: false }
                        ],
                        synonymsExplain: "¡Gran trabajo! 10 menos 4 es 6. ¡Tu cerebro es una súper computadora matemática!"
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

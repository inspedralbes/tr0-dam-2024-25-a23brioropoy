const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Importar uuid para generar sessionId
const path = require('path'); // Para manejar rutas de archivos

const app = express();
const port = 26984;

let mySession = []; // Almacenará las sesiones de los usuarios

// Habilitar CORS
app.use(cors());

// Middleware para parsear el cuerpo de las solicitudes en formato JSON
app.use(bodyParser.json());

// Función para obtener o generar un sessionId
function getMySessionId(sessionId) {
    if (!sessionId || !mySession[sessionId]) {
        sessionId = uuidv4(); // Si no existe sessionId o no es válido, generamos uno nuevo
        mySession[sessionId] = { sessionId }; // Almacenamos la nueva sesión
    }
    return sessionId;
}

// Ruta para obtener todas las preguntas (Read)
app.get('/preguntes', (req, res) => {
    fs.readFile('preguntes.json', 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error leyendo el archivo');
        }
        res.send(JSON.parse(data));
    });
});

// Ruta para crear una nueva pregunta (Create)
app.post('/preguntes', (req, res) => {
    fs.readFile('preguntes.json', 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error leyendo el archivo');
        }
        const questions = JSON.parse(data);
        const newPregunta = req.body;
        questions.preguntes.push(newPregunta);
        
        fs.writeFile('preguntes.json', JSON.stringify(questions, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error guardando la nueva pregunta');
            }
            res.status(201).json(newPregunta);
        });
    });
});

// Ruta para actualizar una pregunta (Update)
app.put('/preguntes/:index', (req, res) => {
    const index = parseInt(req.params.index);
    fs.readFile('preguntes.json', 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error leyendo el archivo');
        }
        const questions = JSON.parse(data);
        if (index < 0 || index >= questions.preguntes.length) {
            return res.status(404).send('Pregunta no encontrada');
        }

        questions.preguntes[index] = req.body;
        fs.writeFile('preguntes.json', JSON.stringify(questions, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error actualizando la pregunta');
            }
            res.json(req.body);
        });
    });
});

// Ruta para eliminar una pregunta (Delete)
app.delete('/preguntes/:index', (req, res) => {
    const index = parseInt(req.params.index);
    fs.readFile('preguntes.json', 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error leyendo el archivo');
        }
        const questions = JSON.parse(data);
        if (index < 0 || index >= questions.preguntes.length) {
            return res.status(404).send('Pregunta no encontrada');
        }

        const deletedPregunta = questions.preguntes.splice(index, 1);
        fs.writeFile('preguntes.json', JSON.stringify(questions, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error eliminando la pregunta');
            }
            res.json(deletedPregunta);
        });
    });
});

// Ruta para obtener preguntas con sesión
app.post('/getPreguntes', (req, res) => {
    const num = req.body.num; // Número de preguntas solicitadas
    let sessionId = getMySessionId(req.body.sessionId); // Obtener o generar sessionId

    if (typeof num !== 'number' || num <= 0) {
        return res.status(400).send('El parámetro "num" debe ser un número positivo.');
    }

    fs.readFile('preguntes.json', 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error leyendo el archivo');
        }
        const questions = JSON.parse(data).preguntes;

        // Seleccionar "num" preguntas y mezclar todas las respuestas
        const preguntesSeleccionades = questions.slice(0, num).map(q => {
            const allAnswers = [...q.respostes_incorrectes, q.resposta_correcta];
            allAnswers.sort(() => Math.random() - 0.5); // Mezclar respuestas

            return {
                pregunta: q.pregunta,
                respostes: allAnswers,
                imatge: q.imatge
            };
        });

        // Guardar las preguntas seleccionadas en la sesión del usuario
        let obj = mySession[sessionId] || { sessionId };
        obj.preguntes = preguntesSeleccionades;
        mySession[sessionId] = obj; // Actualizamos la sesión con las preguntas seleccionadas

        res.json({ sessionId, preguntesSeleccionades }); // Enviamos el sessionId y las preguntas
    });
});

// Ruta para procesar las respuestas del usuario (finalista)
app.post('/finalista', (req, res) => {
    const { sessionId, userAnswers } = req.body; // Recibimos sessionId y las respuestas del usuario
    let obj = mySession[sessionId]; // Recuperamos la sesión

    if (!obj || !Array.isArray(userAnswers)) {
        return res.status(400).send('Sesión no encontrada o respuestas no válidas.');
    }

    fs.readFile('preguntes.json', 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error leyendo el archivo');
        }

        const questions = JSON.parse(data).preguntes;
        let correctAnswers = 0;

        // Verificar respuestas correctas comparando con las preguntas en la sesión
        userAnswers.forEach((answer, index) => {
            const preguntaOriginal = questions.find(p => p.pregunta === obj.preguntes[index].pregunta);
            if (preguntaOriginal && preguntaOriginal.resposta_correcta === answer) {
                correctAnswers++;
            }
        });

        // Guardar los resultados en el archivo JSON
        const gameData = {
            sessionId: sessionId,
            correctAnswers: correctAnswers,
            totalQuestions: userAnswers.length,
            timestamp: new Date().toISOString() // Guardar la fecha y hora de la partida
        };

        // Ruta al archivo donde se guardarán los datos del juego
        const gameFilePath = getGameFilePath();

        // Leer el archivo JSON existente y agregar los datos de la nueva partida
        fs.readFile(gameFilePath, 'utf-8', (err, jsonData) => {
            let games = [];
            if (!err && jsonData) {
                games = JSON.parse(jsonData); // Si existe, parsear el JSON
            }

            games.push(gameData); // Agregar la nueva partida

            // Guardar el archivo JSON actualizado
            fs.writeFile(gameFilePath, JSON.stringify(games, null, 2), (err) => {
                if (err) {
                    return res.status(500).send('Error al guardar los resultados de la partida.');
                }
                console.log('Datos de la partida guardados correctamente');
            });
        });

        // Responder con el total de correctas y el número de preguntas contestadas
        res.json({
            success: correctAnswers,  // Número de respuestas correctas
            total: userAnswers.length  // Total de preguntas que ha contestado
        });
    });
});

// Función para obtener el nombre del archivo según la fecha actual
function getGameFilePath() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const folderPath = path.join(__dirname, 'resultados'); // Ruta de la carpeta "resultados"
    
    // Verificar si la carpeta "resultados" existe, si no, la creamos
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath); // Crear la carpeta si no existe
    }
    
    return path.join(folderPath, `games_${dateStr}.json`); // Ruta del archivo para el día actual en la carpeta "resultados"
}

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

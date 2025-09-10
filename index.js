const express = require('express');
const bodyParser = require('body-parser');
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');
const sqlite3 = require('sqlite3').verbose();

// Inicializar DB en archivo local
const db = new sqlite3.Database('home_finances.db');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS gastos (id INTEGER PRIMARY KEY AUTOINCREMENT, cantidad REAL, fecha TEXT)");
});

// Handlers Alexa
const RegistrarGastoIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegistrarGastoIntent';
  },
  handle(handlerInput) {
    const cantidad = handlerInput.requestEnvelope.request.intent.slots.cantidad.value;
    const fecha = new Date().toISOString();
    db.run("INSERT INTO gastos (cantidad, fecha) VALUES (?, ?)", [cantidad, fecha]);
    const speakOutput = `He registrado un gasto de ${cantidad} dólares.`;
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

const ConsultarGastoIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConsultarGastoIntent';
  },
  handle(handlerInput) {
    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();

    return new Promise((resolve, reject) => {
      db.all("SELECT cantidad, fecha FROM gastos", [], (err, rows) => {
        if (err) {
          reject(err);
        }
        let total = 0;
        rows.forEach(row => {
          const d = new Date(row.fecha);
          if ((d.getMonth() + 1) === mesActual && d.getFullYear() === anioActual) {
            total += row.cantidad;
          }
        });
        const speakOutput = `Has gastado un total de ${total} dólares este mes.`;
        resolve(handlerInput.responseBuilder.speak(speakOutput).getResponse());
      });
    });
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Puedes decir registrar un gasto de 20 dólares, o preguntarme cuánto has gastado este mes.';
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    return handlerInput.responseBuilder.speak('Ha ocurrido un error.').getResponse();
  }
};

// Crear skill builder
const skillBuilder = Alexa.SkillBuilders.custom();
skillBuilder.addRequestHandlers(
  RegistrarGastoIntentHandler,
  ConsultarGastoIntentHandler,
  HelpIntentHandler
);
skillBuilder.addErrorHandlers(ErrorHandler);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

const app = express();
app.use(bodyParser.json());
app.post('/alexa', adapter.getRequestHandlers());

// Puerto
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor Alexa escuchando en puerto ${port}`);
});

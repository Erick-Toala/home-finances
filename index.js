const express = require('express');
const bodyParser = require('body-parser');
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');

const app = express();
app.use(bodyParser.json());

// === Handler mínimo ===
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Hola, estoy vivo!';
    return handlerInput.responseBuilder.speak(speechText).getResponse();
  },
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
    const speechText = '¡Hola! Esto es una prueba.';
    return handlerInput.responseBuilder.speak(speechText).getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log('Error:', error.message);
    return handlerInput.responseBuilder
      .speak('Ha ocurrido un error en la skill.')
      .getResponse();
  },
};

// === Skill Alexa ===
const skillBuilder = Alexa.SkillBuilders.custom();
skillBuilder.addRequestHandlers(
  LaunchRequestHandler,
  HelloWorldIntentHandler
);
skillBuilder.addErrorHandlers(ErrorHandler);

const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, false, false);

app.post('/alexa', adapter.getRequestHandlers());

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor de prueba Alexa escuchando en puerto ${port}`));

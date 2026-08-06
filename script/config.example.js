// Plantilla de configuración. Copia este archivo a script/config.js
// y rellena los valores reales. config.js está ignorado por git.
//
// La access key se obtiene en https://web3forms.com registrando
// info@ayurvedskepobyty.sk — ese es el correo al que llegan los envíos.
//
// Ojo: la key acaba siendo visible en el navegador (viaja en el fetch).
// Web3Forms la expone siempre en el cliente; sacarla del repo evita
// commitearla, no la vuelve secreta.
window.APP_CONFIG = {
  WEB3FORMS_ACCESS_KEY: "TU_ACCESS_KEY_AQUI",
  WEB3FORMS_ENDPOINT: "https://api.web3forms.com/submit",
};

let CONFIG = {
  modeChangeButton: 1,
  lights: [
    {
      description: 'Shely Duo',
      adress: 'http://192.168.0.145/light/0',
      transition: 1000 // 0..5000 [ms]
    }
  ]
};

Shelly.addEventHandler(
  function(event, ud) {
    // uncoment for button number debugging
    //print(JSON.stringify({id: event.info.id, event: event.info.event}));

    if (event.info.id === CONFIG.modeChangeButton && 
        event.info.event === 'single_push') {

      for (let i in CONFIG.lights) {
        Shelly.call("HTTP.GET", {
            url: CONFIG.lights[i].adress
          },
          function(res, error_code, error_msg, ud) {
            let res = JSON.parse(res.body);
            if (res.ison === true) {
              change(ud, res.temp);
            }
          },
          i
        );
      }
    }
  },
  null
);

function change(i, temp) {
  let newTemp = temp;
  if (temp > 4000) {
    newTemp = 3000
  } else {
    newTemp = 5000
  }

  Shelly.call("HTTP.GET", {
      url: CONFIG.lights[i].adress + '?temp=' + JSON.stringify(newTemp) +
        '&transition=' + JSON.stringify(CONFIG.lights[i].transition)
    },
    function(res, error_code, error_msg, ud) {
      if (error_code !== 0 || res.code !== 200) {
        print(JSON.stringify({
          res: res,
          error_code: error_code,
          error_msg: error_msg
        }));
      }
    }
  );
}

let CONFIG = {
  brightnessUpButton: 3,
  brightnessDownButton: 2,
  brightnesStep: 10,
  changeSpeed: 0.25 * 1000, // seconds * 1000
  mode: 0,
  lights: [
    {
      description: 'Shely Duo',
      adress: 'http://192.168.0.145/light/0',
      transition: 4000 // 0..5000 [ms]
    },
    {
      description: 'Shely Duo RGB',
      adress: 'http://192.168.0.146/light/0',
      transition: 500 // 0..5000 [ms]
    }
  ]
};

let changeTimer = null;
let stopTimerFlag = false; //failsafe to stop timer if race-condition occures

Shelly.addEventHandler(
  function(event, ud) {
    // uncoment for button number debugging
    //print(JSON.stringify({id: event.info.id, event: event.info.event}));

    if (event.info.id !== CONFIG.brightnessUpButton &&
        event.info.id !== CONFIG.brightnessDownButton) {
      return;
    }
    
    if (event.info.id === CONFIG.brightnessUpButton) {
      CONFIG.mode = 1;
    } else {
      CONFIG.mode = -1;
    }
    
    if (event.info.event === 'btn_down') {
      stopTimerFlag = false;

      for (let i in CONFIG.lights) {
        Shelly.call("HTTP.GET", {
            url: CONFIG.lights[i].adress
          },
          function(res, error_code, error_msg, ud) {
            let res = JSON.parse(res.body);
            if (res.ison === true) {
              change(ud, res.brightness);
            }
          },
          i
        );
      }
    }
    
    if (event.info.event === 'btn_up') {
      stopTimerFlag = true;
      stopTimer();
    }
  },
  null
);

function change(i, brightnes) {
  if ((brightnes >= 100 && CONFIG.mode === 1) ||
    (brightnes <= 1 && CONFIG.mode === -1)
  ) {
    return;
  }

  let newBrightnes = brightnes + (CONFIG.brightnesStep * CONFIG.mode);
  if (newBrightnes >= 100) {
    newBrightnes = 100;
  }
  if (newBrightnes <= 1) {
    newBrightnes = 1;
  }
  //print(i, ':', newBrightnes);

  Shelly.call("HTTP.GET", {
      url: CONFIG.lights[i].adress + '?brightness=' + JSON.stringify(newBrightnes) +
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

      if (stopTimerFlag) {
        return;
      }
      changeTimer = Timer.set(
        CONFIG.changeSpeed,
        false,
        function(ud) {
          change(ud[0], ud[1]);
        },
        ud
      );
    },
    [i, newBrightnes]
  );
}

function stopTimer() {
  Timer.clear(changeTimer);
}

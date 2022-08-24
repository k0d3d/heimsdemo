var config = require('config').sms,
    debug = require('debug')('sms'),
    Q = require('q'),
    _ = require('lodash');

var sender = {

  sendSMS : function sendSMS (message, sendTo) {
    // var smsApi = "";
    var s = Q.defer();

    if (!sendTo) {
        s.reject(new Error('empty recipents phone number'));
        return s.promise;
    }
    function commArr (arrStr) {
      if (_.isString(arrStr) || _.isNumber(arrStr)) {

        if (arrStr.toString().substr(0, 1) === '0') {
          return "+234" + arrStr.substr(1);
        } else {
          return arrStr;
        }
      }

      if (_.isArray(arrStr)) {
        var nombers =  _.map(arrStr, function (nomber) {
            if (nomber.toString().substr(0, 1) === '0') {
              return '+234' + nomber.substr(1);
            } else {
              return nomber;
            }
        });
        return nombers;
      }

      return s.reject(new Error ('invalid senders list'));
    }

    // if (process.env.NODE_ENV === 'development') {
    //     // smsApi += "http://www.smslive247.com/http/index.aspx?cmd=sendquickmsg&owneremail=" + config.owneremail;
    //     // smsApi += "&subacct=" + config.subacct;
    //     // smsApi += "&subacctpwd=" + config.subacctpwd;
    //     // smsApi += "&message=" + encodeURIComponent(message);
    //     // smsApi += "&sender=" + config.sender;
    //     // smsApi += "&sendto=" + commArr(sendTo);
    //     // smsApi += "&msgtype=0";
    //     //
    //     //
    //     smsApi += "http://smsgator.com/bulksms?";
    //     smsApi += "email=" + "michael.rhema@gmail.com";
    //     smsApi += "&password=" + "login60";
    //     smsApi += "&type=0";
    //     smsApi += "&dlr=0";
    //     smsApi += "&destination=" + commArr(sendTo);
    //     smsApi += "&sender=" + config.general.sender;
    //     smsApi += "&message=" + message;
    //     smsApi += "&message=" + encodeURIComponent(message);

    //     //
    //     // smsApi += "http://121.241.242.114:8080/sendsms?";
    //     // smsApi += "username=" + "ihs-ikeja";
    //     // smsApi += "&password=" + "welcome";
    //     // smsApi += "&type=0";
    //     // smsApi += "&dlr=1";
    //     // smsApi += "&destination=" + commArr(sendTo);
    //     // smsApi += "&source=" + config.general.sender;
    //     // smsApi += "&message=" + message;
    //     // smsApi += "&message=" + encodeURIComponent(message);

    //     console.log(smsApi);
    //     // return s.resolve(true);
    //     restler.get(smsApi)
    //     .on('complete', function (data) {
    //       console.log(data);
    //       if (data instanceof Error) {
    //         return s.reject(data);
    //       }
    //       return s.resolve(data);
    //     });
    //     //
    // } else

    var client = require('twilio')(config.accounts.twilio.accountSID, config.accounts.twilio.accountToken);
    // var client = require('twilio')('ACf84b0e66680f730edd639741d8879a89', 'fe8f201a6244729e2ea8eb0bd595c054');


    var nombers = commArr(sendTo);
    function send () {
        var indexNo = nombers.pop();
        client.messages.create({
            body: message,
            to: indexNo,
            // from: "+15005550006"
            from: "+12086960938"
        }, function(err, message) {
            debug(err, message);
          if (err) {
            return s.reject(err);
          }
          if (nombers.length) {
            return send();
          }
          return s.resolve(message);

        });
    }

    send();



    return s.promise;
  }
};


module.exports = sender;
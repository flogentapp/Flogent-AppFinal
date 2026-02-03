const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    '5e3dbca3693aaf93f0445f729dff5d95',
    '1c0d5d6d6075f6385c66bc40cdf795eb'
);

const request = mailjet
    .post("send", { 'version': 'v3.1' })
    .request({
        "Messages": [
            {
                "From": {
                    "Email": "flogent.app@gmail.com",
                    "Name": "Test Sender"
                },
                "To": [
                    {
                        "Email": "flogent.app@gmail.com",
                        "Name": "Test Recipient"
                    }
                ],
                "Subject": "Test Email",
                "TextPart": "This is a test to verify API keys.",
            }
        ]
    });

request
    .then((result) => {
        console.log("SUCCESS!");
        console.log(result.body);
    })
    .catch((err) => {
        console.log("FAILURE");
        console.log("Status:", err.statusCode);
        console.log("Message:", err.message);
        // console.log("Full Error:", err);
    });

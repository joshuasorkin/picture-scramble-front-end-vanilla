
const response = await fetch(`../api/default-contact`);
const default_contact_info = await response.text();
document.getElementById('game-message').innerHTML = "<h1>Desktop Site Under Development</h1>"+
                                                    "<p>Our desktop site is currently under development."+
                                                    "Please visit us on a mobile device in the meantime. Thank you for your understanding!</p>"+
                                                    `<p>Contact: <a href="${default_contact_info}" target="_blank">${default_contact_info}</a></p>`

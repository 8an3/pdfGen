const axios = require("axios");

axios
  .post("http://localhost:3066/generate", {
    clientName: "john doe",
    clientStreet: "1234 street",
    clientProv: "ON",
    clientPhone: "6136136134",
    year: "2014",
    make: "honda",
    model: "accord",
    price: "19,995",
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });

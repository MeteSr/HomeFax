// Jest mock — prevents resend/svix/uuid ESM deps from being loaded in tests.
const express = require("express");
module.exports = { bidtolistRouter: express.Router() };

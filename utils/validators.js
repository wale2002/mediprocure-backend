// utils/validators.js
const ALLOWED_DOMAINS = process.env.ALLOWED_EMAIL_DOMAINS.split(",");

const validateEmailDomain = (email) => {
  const domain = email.split("@")[1];
  return ALLOWED_DOMAINS.includes(`@${domain}`);
};

module.exports = { validateEmailDomain };

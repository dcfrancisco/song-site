const URL_PATTERN = /^(https?:\/\/|\/)[^\s]+$/i;

function text(value, path, errors, required = true) {
  if (typeof value !== 'string' || (required && !value.trim())) errors.push(`${path} must be a non-empty string`);
}

function url(value, path, errors) {
  if (typeof value !== 'string' || !URL_PATTERN.test(value) || value === '#') errors.push(`${path} must be an http(s) or application-relative URL`);
}

function validateAnnouncementPage(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { valid: false, errors: ['payload must be an object'] };
  if (payload.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  for (const section of ['hero', 'reminder']) {
    if (!payload[section] || typeof payload[section] !== 'object') errors.push(`${section} is required`);
    else { text(payload[section].title, `${section}.title`, errors); text(payload[section].body, `${section}.body`, errors); }
  }
  for (const [name, fields] of [['carousel', ['name', 'body', 'image']], ['trainings', ['title', 'description', 'link', 'linkLabel']], ['notices', ['title', 'body']]]) {
    if (!Array.isArray(payload[name])) { errors.push(`${name} must be an array`); continue; }
    payload[name].forEach((item, index) => {
      if (!item || typeof item !== 'object') { errors.push(`${name}[${index}] must be an object`); return; }
      for (const field of fields) text(item[field], `${name}[${index}].${field}`, errors);
      if (name === 'trainings') url(item.link, `${name}[${index}].link`, errors);
      if (item.order !== undefined && !Number.isInteger(item.order)) errors.push(`${name}[${index}].order must be an integer`);
    });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateAnnouncementPage };

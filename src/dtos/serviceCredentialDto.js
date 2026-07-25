exports.toSaveInput = (body) => {
  const { service_name, username, password, notes } = body;
  if (!service_name) {
    const err = new Error('service_name is required');
    err.status = 400;
    throw err;
  }
  return {
    service_name,
    username: username || '',
    password: password || '',
    notes: notes || '',
  };
};

const UPDATE_FIELDS = ['name', 'environment', 'ip_address', 'domain', 'ssh_user', 'notes', 'is_sensitive'];

exports.toCreateInput = (body) => {
  const { project_id, name, environment, ip_address, domain, ssh_user, notes, is_sensitive } = body;
  return {
    project_id: project_id || null,
    name,
    environment,
    ip_address,
    domain,
    ssh_user,
    notes,
    is_sensitive: is_sensitive || false,
  };
};

exports.toUpdateInput = (body) => {
  const updates = {};
  UPDATE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) updates[f] = body[f];
  });
  return updates;
};

// Mask sensitive fields unless the caller explicitly asked to see them (role-based in real app).
exports.toResponseList = (rows, showSensitive) => rows.map((r) => ({
  ...r,
  ip_address: showSensitive ? r.ip_address : r.is_sensitive ? '••••••••' : r.ip_address,
  ssh_user: showSensitive ? r.ssh_user : r.is_sensitive ? '••••••••' : r.ssh_user,
}));

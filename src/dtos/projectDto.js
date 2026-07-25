const UPDATE_FIELDS = ['name', 'description', 'repo_url', 'docs_url', 'status', 'start_date', 'expected_end_date'];

function toArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
}

function toJSON(v) {
  if (!v) return null;
  const arr = Array.isArray(v) ? v : [v];
  const clean = arr.map(s => String(s).trim()).filter(Boolean);
  return clean.length ? JSON.stringify(clean) : null;
}

exports.toCreateInput = (body) => {
  const { name, description, repo_url, docs_url, status, start_date, expected_end_date } = body;
  return {
    name,
    description,
    repo_url: toJSON(repo_url),
    docs_url: toJSON(docs_url),
    status: status || 'active',
    start_date: start_date || null,
    expected_end_date: expected_end_date || null,
  };
};

exports.toUpdateInput = (body) => {
  const updates = {};
  UPDATE_FIELDS.forEach((f) => {
    if (body[f] === undefined) return;
    if (f === 'repo_url' || f === 'docs_url') {
      updates[f] = toJSON(body[f]);
    } else {
      updates[f] = body[f];
    }
  });
  return updates;
};

// Shape repo_url/docs_url (stored as JSON strings) back into arrays for the client.
exports.toResponse = (project) => {
  if (!project) return project;
  return { ...project, repo_url: toArr(project.repo_url), docs_url: toArr(project.docs_url) };
};

exports.toResponseList = (projects) => projects.map(exports.toResponse);

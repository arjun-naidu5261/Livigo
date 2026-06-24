export function formatDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  if (obj._id) {
    obj.id = String(obj._id);
    delete obj._id;
  }
  if (obj.__v !== undefined) delete obj.__v;
  if (obj.password) delete obj.password;
  return obj;
}

export function formatDocs(docs) {
  return (docs || []).map(formatDoc);
}

export function toObjectId(value) {
  return value;
}

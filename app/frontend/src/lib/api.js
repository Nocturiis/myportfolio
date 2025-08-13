import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; // must be set in frontend/.env
const API = `${BACKEND_URL}/api`;

export async function fetchProjects(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API}/projects?${query}` : `${API}/projects`;
  const { data } = await axios.get(url);
  return data.items || [];
}

export async function fetchFeatured() {
  const { data } = await axios.get(`${API}/projects/featured`);
  return data.items || [];
}

export async function fetchProject(id) {
  const { data } = await axios.get(`${API}/projects/${id}`);
  return data;
}

export async function updateProject(id, body) {
  const { data } = await axios.put(`${API}/projects/${id}`, body);
  return data;
}

export async function createProjects(payload) {
  const { data } = await axios.post(`${API}/projects`, payload);
  return data;
}

export async function sendContact(body) {
  const { data } = await axios.post(`${API}/contact`, body);
  return data;
}
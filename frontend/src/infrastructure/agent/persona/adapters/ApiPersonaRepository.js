import { Persona, PersonaSet } from '../../../../domain/agent/persona/models/Persona';
import { PersonaRepository } from '../../../../domain/agent/persona/ports/PersonaRepository';

export class ApiPersonaRepository extends PersonaRepository {
    constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') {
        super();
        this.baseUrl = baseUrl;
    }

    async listPersonas() {
        const response = await fetch(`${this.baseUrl}/personas/`);
        if (!response.ok) throw new Error('Failed to fetch personas');
        const data = await response.json();
        return data.map(item => new Persona(item));
    }

    async createPersona(data) {
        const response = await fetch(`${this.baseUrl}/personas/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create persona');
        const item = await response.json();
        return new Persona(item);
    }

    async listPersonaSets() {
        const response = await fetch(`${this.baseUrl}/personas/sets`);
        if (!response.ok) throw new Error('Failed to fetch persona sets');
        const data = await response.json();
        return data.map(item => new PersonaSet(item));
    }

    async createPersonaSet(data) {
        const response = await fetch(`${this.baseUrl}/personas/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create persona set');
        const item = await response.json();
        return new PersonaSet(item);
    }

    async getPersona(id) {
        const response = await fetch(`${this.baseUrl}/personas/${id}`);
        if (!response.ok) throw new Error('Failed to fetch persona');
        const data = await response.json();
        return new Persona(data);
    }

    async getPersonaSet(id) {
        const response = await fetch(`${this.baseUrl}/personas/sets/${id}`);
        if (!response.ok) throw new Error('Failed to fetch persona set');
        const data = await response.json();
        return new PersonaSet(data);
    }

    async updatePersona(id, data) {
        const response = await fetch(`${this.baseUrl}/personas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update persona');
        const item = await response.json();
        return new Persona(item);
    }

    async updatePersonaSet(id, data) {
        const response = await fetch(`${this.baseUrl}/personas/sets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update persona set');
        const item = await response.json();
        return new PersonaSet(item);
    }
}

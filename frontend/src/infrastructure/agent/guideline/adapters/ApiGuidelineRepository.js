import { Guideline, GuidelineSet } from '../../../../domain/agent/guideline/models/Guideline';
import { GuidelineRepository } from '../../../../domain/agent/guideline/ports/GuidelineRepository';

export class ApiGuidelineRepository extends GuidelineRepository {
    constructor(baseUrl = 'http://localhost:8000') {
        super();
        this.baseUrl = baseUrl;
    }

    async listGuidelines() {
        const response = await fetch(`${this.baseUrl}/guidelines/`);
        if (!response.ok) throw new Error('Failed to fetch guidelines');
        const data = await response.json();
        return data.map(item => new Guideline(item));
    }

    async createGuideline(data) {
        const response = await fetch(`${this.baseUrl}/guidelines/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create guideline');
        const item = await response.json();
        return new Guideline(item);
    }

    async listGuidelineSets() {
        const response = await fetch(`${this.baseUrl}/guidelines/sets`);
        if (!response.ok) throw new Error('Failed to fetch guideline sets');
        const data = await response.json();
        return data.map(item => new GuidelineSet(item));
    }

    async createGuidelineSet(data) {
        const response = await fetch(`${this.baseUrl}/guidelines/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create guideline set');
        const item = await response.json();
        return new GuidelineSet(item);
    }

    async getGuideline(id) {
        const response = await fetch(`${this.baseUrl}/guidelines/${id}`);
        if (!response.ok) throw new Error('Failed to fetch guideline');
        const data = await response.json();
        return new Guideline(data);
    }

    async getGuidelineSet(id) {
        const response = await fetch(`${this.baseUrl}/guidelines/sets/${id}`);
        if (!response.ok) throw new Error('Failed to fetch guideline set');
        const data = await response.json();
        return new GuidelineSet(data);
    }
}

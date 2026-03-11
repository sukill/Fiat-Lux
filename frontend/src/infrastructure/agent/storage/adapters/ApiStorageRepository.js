export class ApiStorageRepository {
    constructor(baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async listRepositories() {
        const response = await fetch(`${this.baseUrl}/storage/repositories`);
        if (!response.ok) throw new Error('Failed to fetch repositories');
        return await response.json();
    }

    async listRefs(repoName, namespace = 'fiat-lux-system') {
        const response = await fetch(`${this.baseUrl}/storage/refs?repo_name=${encodeURIComponent(repoName)}&namespace=${encodeURIComponent(namespace)}`);
        if (!response.ok) throw new Error('Failed to fetch refs');
        const data = await response.json();
        return data.refs || [];
    }

    async deleteRepository(repoName) {
        const response = await fetch(`${this.baseUrl}/storage/repository?name=${encodeURIComponent(repoName)}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete repository');
        return await response.json();
    }
}

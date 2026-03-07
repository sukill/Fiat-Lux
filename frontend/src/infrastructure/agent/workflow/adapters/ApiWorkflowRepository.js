const API_BASE_URL = 'http://localhost:8000';

class ApiWorkflowRepository {
    async runWorkflow(userRequest, personaSetId = null, guidelineSetId = null) {
        const response = await fetch(`${API_BASE_URL}/workflow/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_request: userRequest,
                persona_set_id: personaSetId,
                guideline_set_id: guidelineSetId,
            }),
        });

        if (!response.ok) {
            throw new Error(`Execution failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async getRunStatus(runId) {
        const response = await fetch(`${API_BASE_URL}/workflow/${runId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch status: ${response.statusText}`);
        }
        return await response.json();
    }
}

export default new ApiWorkflowRepository();

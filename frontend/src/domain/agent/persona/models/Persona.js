export class Persona {
    constructor({ id, name, role, system_prompt, goals, motivation, constraints, guidelines, created_at }) {
        this.id = id;
        this.name = name || '';
        this.role = role;
        this.systemPrompt = system_prompt;
        this.goals = goals || [];
        this.motivation = motivation;
        this.constraints = constraints || [];
        this.guidelines = guidelines || [];
        this.createdAt = created_at;
    }
}

export class PersonaSet {
    constructor({ id, name, description, personas, created_at }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.personas = personas ? personas.map(p => new Persona(p)) : [];
        this.createdAt = created_at;
    }
}

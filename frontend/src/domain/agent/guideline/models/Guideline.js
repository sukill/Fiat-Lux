export class Guideline {
    constructor({ id, title, content, created_at }) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = created_at;
    }
}

export class GuidelineSet {
    constructor({ id, name, description, repository, branch, guidelines, created_at }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.repository = repository || 'guideline-repo';
        this.branch = branch || 'main';
        this.guidelines = guidelines ? guidelines.map(g => new Guideline(g)) : [];
        this.createdAt = created_at;
    }
}

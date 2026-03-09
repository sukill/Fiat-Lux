export class Guideline {
    constructor({ id, title, content, directory, repository, branch, created_at }) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.directory = directory;
        this.repository = repository;
        this.branch = branch;
        this.createdAt = created_at;
    }
}

export class GuidelineSet {
    constructor({ id, name, description, guidelines, created_at }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.guidelines = guidelines ? guidelines.map(g => new Guideline(g)) : [];
        this.createdAt = created_at;
    }
}

import React from 'react';
import { Database } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

const RepoSelector = ({ repositories, selectedRepo, onSelect }) => {
    const options = repositories.map((r) => ({ value: r.name, label: r.name }));
    return (
        <CustomSelect
            id="repo-selector"
            icon={<Database className="w-4 h-4" />}
            value={selectedRepo || ''}
            options={options}
            onChange={onSelect}
            placeholder="저장소 선택..."
        />
    );
};

export default RepoSelector;

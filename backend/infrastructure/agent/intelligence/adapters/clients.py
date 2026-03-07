import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from domain.agent.intelligence.ports.outputs import ContextInferrer


class BaseLLMInferrer(ContextInferrer, ABC):
    """LLM 기반 추론기의 공통 로직을 담당하는 베이스 클래스"""

    def _get_intent_system_prompt(
        self,
        available_personas: Optional[List[str]] = None,
        available_guidelines: Optional[List[str]] = None,
    ) -> str:
        prompt = """
        You are an AI assistant that infers user intent and suggests THE MOST RELEVANT persona names and guidelines from the provided lists.

        ### RULES:
        1. **STRICT SELECTION**: If "AVAILABLE PERSONAS" is provided, you MUST suggest NAMEs ONLY from that list.
        2. **NO HALLUCINATION**: If "AVAILABLE GUIDELINES" is provided, you MUST suggest guideline names ONLY from that list. 
        3. **NO CONTENT GENERATION**: Do NOT create new guideline content or descriptions. Only return the NAMES of existing guidelines.
        4. **EMPTY LISTS**: If no relevant match is found in the provided lists, return an empty list `[]` for that field.

        Respond ONLY in JSON format with the following keys:
        - intent: (string) The inferred intent
        - personas: (list of objects) Suggested personas, each with:
            - role: (string) The persona name (MUST exactly match one from AVAILABLE PERSONAS)
            - reason: (string) Concise reason why this persona is needed for this request
        - suggested_guidelines: (list of strings) Names of suggested guidelines (MUST exactly match ones from AVAILABLE GUIDELINES)
        """

        if available_personas:
            prompt += f"\n### AVAILABLE PERSONAS:\n{', '.join(available_personas)}"

        if available_guidelines:
            prompt += f"\n### AVAILABLE GUIDELINES:\n{', '.join(available_guidelines)}"

        return prompt

    def _get_decomposition_system_prompt(self, selected_personas: List[Dict[str, Any]]) -> str:
        persona_info = "\n".join([f"- {p['persona'].name}: {p['persona'].role}" for p in selected_personas])
        return f"""
        You are an Orchestrator. Your goal is to decompose a complex user request into specific, non-overlapping sub-tasks for each selected persona.

        ### SELECTED PERSONAS:
        {persona_info}

        ### RULES:
        1. **MATCH TASKS**: Assign exactly one task to each persona that fits their expertise.
        2. **JSON ONLY**: Respond ONLY in JSON list format. Each object must have:
           - persona_name: (string) The exact name of the persona.
           - task: (string) A clear, actionable instruction for this persona.
        """

    def _get_execution_system_prompt(self, persona_context: Dict[str, Any], guidelines: List[str]) -> str:
        name = persona_context.get("name", "Assistant")
        role = persona_context.get("role", "Helpful assistant")
        system_prompt = persona_context.get("system_prompt", "")
        
        prompt = f"""
        You are {name}.
        Your Role: {role}
        {system_prompt}

        ### GUIDELINES:
        {", ".join(guidelines) if guidelines else "Follow general best practices."}

        Respond in character. Perform the task assigned to you thoroughly.
        """
        return prompt

    def _get_aggregation_system_prompt(self) -> str:
        return """
        You are an Editor. You have multiple outputs from different specialists.
        Your goal is to aggregate and harmonize these outputs into a single, cohesive response that directly addresses the original user request.
        
        ### IMPORTANT RULES:
        1. **NO LOSS OF DETAIL**: Do NOT summarize or shorten the specialist's outputs. Keep ALL critical technical details, code blocks, and specific descriptions.
        2. **DEDUPLICATION**: Only remove exact repetitive sections. If two specialists provide complementary details, keep both.
        3. **COHESION**: Focus on the flow and structure so it reads as one document, not a series of reports.
        """

    @abstractmethod
    def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        pass

    def infer_intent(
        self,
        user_request: str,
        available_personas: Optional[List[str]] = None,
        available_guidelines: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        response_text = self._call_llm(
            prompt=f"User Request: {user_request}",
            system_instruction=self._get_intent_system_prompt(
                available_personas, available_guidelines
            ),
        )
        print(f"DEBUG: Raw LLM Intent Inference Result:\n{response_text}")
        try:
            # 기초적인 JSON 추출 (마크다운 코드 블록 등 제거)
            clean_json = (
                response_text.strip().replace("```json", "").replace("```", "").strip()
            )
            return json.loads(clean_json)
        except Exception as e:
            print(f"ERROR: Failed to parse LLM response as JSON: {e}")
            # fallback 시에도 더 상세한 이유 제공
            fallback_role = available_personas[0] if available_personas else "Assistant"
            return {
                "intent": "unknown",
                "personas": [
                    {
                        "role": fallback_role,
                        "reason": f"Fallback selected first available role '{fallback_role}' due to inference parsing error.",
                    }
                ],
                "suggested_guidelines": ["general"],
            }

    def decompose_tasks(
        self, user_request: str, selected_personas: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        response_text = self._call_llm(
            prompt=f"User Request: {user_request}",
            system_instruction=self._get_decomposition_system_prompt(selected_personas),
        )
        try:
            clean_json = response_text.strip().replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        except Exception as e:
            print(f"ERROR: Decomposition failed: {e}")
            return [{"persona_name": p["persona"].name, "task": user_request} for p in selected_personas]

    def execute_task(
        self, persona_context: Dict[str, Any], task: str, guidelines: List[str]
    ) -> str:
        return self._call_llm(
            prompt=f"Task: {task}",
            system_instruction=self._get_execution_system_prompt(persona_context, guidelines),
        )

    def aggregate_results(self, user_request: str, results: List[Dict[str, Any]]) -> str:
        combined_context = "\n\n".join([f"### RESULT FROM {r['persona_name']}:\n{r['output']}" for r in results])
        return self._call_llm(
            prompt=f"Original Request: {user_request}\n\nCollected Outputs:\n{combined_context}",
            system_instruction=self._get_aggregation_system_prompt(),
        )


class GeminiContextInferrer(BaseLLMInferrer):
    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash", max_tokens: int = 4096):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
        except ImportError:
            raise ImportError(
                "Please install 'langchain-google-genai' to use GeminiContextInferrer."
            )

        self.llm = ChatGoogleGenerativeAI(
            api_key=api_key, model=model_name, temperature=0, max_output_tokens=max_tokens
        )

    def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        from langchain_core.messages import SystemMessage, HumanMessage

        messages = []
        if system_instruction:
            messages.append(SystemMessage(content=system_instruction))
        messages.append(HumanMessage(content=prompt))

        response = self.llm.invoke(messages)
        return response.content


class OpenAIContextInferrer(BaseLLMInferrer):
    def __init__(self, api_key: str, model_name: str = "gpt-4o", max_tokens: int = 4096):
        try:
            from langchain_openai import ChatOpenAI
        except ImportError:
            raise ImportError(
                "Please install 'langchain-openai' to use OpenAIContextInferrer."
            )

        self.llm = ChatOpenAI(api_key=api_key, model=model_name, temperature=0, max_tokens=max_tokens)

    def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        from langchain_core.messages import SystemMessage, HumanMessage

        messages = []
        if system_instruction:
            messages.append(SystemMessage(content=system_instruction))
        messages.append(HumanMessage(content=prompt))

        response = self.llm.invoke(messages)
        return response.content

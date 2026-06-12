from collections import defaultdict
from typing import List
from ..schemas.models import TaskItem, RiskLevel, ValidationIssue


class ValidatorAgent:
    """Sidecar agent that cross-checks pipeline output and flags gaps for a
    targeted correction pass (without re-running the full pipeline)."""

    async def validate(self, tasks: List[TaskItem], roster: List[str]) -> List[ValidationIssue]:
        issues: List[ValidationIssue] = []
        roster_lower = {name.lower() for name in roster}

        deadline_owners = defaultdict(list)
        for task in tasks:
            if not task.owner or task.owner == "Unassigned":
                issues.append(ValidationIssue(
                    task_id=task.id or "",
                    issue_type="unowned_task",
                    detail=f"Task '{task.task}' has no owner"
                ))
            elif roster_lower and task.owner.lower() not in roster_lower:
                issues.append(ValidationIssue(
                    task_id=task.id or "",
                    issue_type="owner_not_in_roster",
                    detail=f"Owner '{task.owner}' was not identified as a meeting participant"
                ))

            if task.risk == RiskLevel.UNKNOWN:
                issues.append(ValidationIssue(
                    task_id=task.id or "",
                    issue_type="missing_risk_score",
                    detail=f"Task '{task.task}' has no risk score"
                ))

            if task.owner and task.deadline:
                deadline_owners[(task.owner.lower(), task.deadline.lower())].append(task)

        for (owner, deadline), conflicting in deadline_owners.items():
            if len(conflicting) > 1:
                names = "; ".join(t.task for t in conflicting)
                for task in conflicting:
                    issues.append(ValidationIssue(
                        task_id=task.id or "",
                        issue_type="conflicting_deadline",
                        detail=f"'{task.owner}' has {len(conflicting)} tasks due '{task.deadline}': {names}"
                    ))

        return issues

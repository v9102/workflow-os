from collections import defaultdict
from typing import List, Optional
from schemas.models import TaskItem, RiskLevel, ValidationIssue


class ValidatorAgent:
    """Sidecar agent that cross-checks pipeline output and flags gaps for a
    targeted correction pass (without re-running the full pipeline). When given
    prior-meeting context it also detects cross-meeting deadline conflicts —
    emergent coordination across transcripts."""

    async def validate(
        self,
        tasks: List[TaskItem],
        roster: List[str],
        prior_context: Optional[List[dict]] = None,
    ) -> List[ValidationIssue]:
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

        # Cross-meeting coordination: a person already committed to a task with
        # the same deadline in a prior meeting is double-booked across meetings.
        if prior_context:
            prior_by_owner_deadline: dict[tuple, list[dict]] = defaultdict(list)
            for p in prior_context:
                p_owner = (p.get("owner") or "").lower()
                p_deadline = (p.get("deadline") or "").lower()
                if p_owner and p_deadline:
                    prior_by_owner_deadline[(p_owner, p_deadline)].append(p)

            for task in tasks:
                if not task.owner or not task.deadline:
                    continue
                key = (task.owner.lower(), task.deadline.lower())
                clashes = prior_by_owner_deadline.get(key)
                if clashes:
                    prior_meeting = clashes[0].get("meeting_id", "another meeting")
                    prior_task = clashes[0].get("task", "")
                    issues.append(ValidationIssue(
                        task_id=task.id or "",
                        issue_type="cross_meeting_conflict",
                        detail=(
                            f"'{task.owner}' is already committed to '{prior_task}' "
                            f"due '{task.deadline}' in meeting {prior_meeting}"
                        )
                    ))

        return issues

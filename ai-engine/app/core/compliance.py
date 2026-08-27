from typing import List
from app.schemas.detection import DetectedObject, ComplianceReport, ComplianceStatus

def evaluate_compliance(objects: List[DetectedObject]) -> ComplianceReport:
    """
    Evaluates worker PPE compliance based on detected safety helmets and reflective vests.
    """
    helmet_count = sum(1 for obj in objects if "helmet" in obj.label.lower())
    jacket_count = sum(1 for obj in objects if "jacket" in obj.label.lower() or "vest" in obj.label.lower())
    total = len(objects)
    
    if total == 0:
        return ComplianceReport(
            status=ComplianceStatus.NON_COMPLIANT,
            helmet_count=0,
            jacket_count=0,
            total_detected=0,
            compliance_score=0.0,
            message="No workers or PPE equipment detected in this frame.",
            recommendations=[
                "Ensure workers enter the active camera surveillance field.",
                "Verify camera angle and adequate jobsite lighting conditions."
            ]
        )
    
    recommendations = []
    
    if helmet_count > 0 and jacket_count > 0:
        diff = abs(helmet_count - jacket_count)
        max_count = max(helmet_count, jacket_count)
        min_count = min(helmet_count, jacket_count)
        
        score = round((min_count / max_count) * 100, 1)
        
        if diff == 0:
            status = ComplianceStatus.COMPLIANT
            message = f"Full Compliance! All workers ({min_count} workers) detected wearing required helmets and safety vests."
            recommendations.append("Maintain high safety standards across the jobsite.")
        else:
            status = ComplianceStatus.PARTIAL
            if helmet_count > jacket_count:
                missing = helmet_count - jacket_count
                message = f"Partial Compliance: {missing} worker(s) missing high-visibility reflective vests."
                recommendations.append(f"Equip {missing} worker(s) with EN ISO 20471 compliant reflective vests.")
            else:
                missing = jacket_count - helmet_count
                message = f"Partial Compliance: {missing} worker(s) missing safety helmets."
                recommendations.append(f"Impact Hazard: Ensure {missing} worker(s) immediately wear EN 397 safety helmets.")
    elif helmet_count > 0 and jacket_count == 0:
        status = ComplianceStatus.PARTIAL
        score = 50.0
        message = f"Warning: {helmet_count} safety helmet(s) detected, but no reflective vests identified."
        recommendations.append("Workers must wear reflective vests for visibility in active machinery zones.")
    elif jacket_count > 0 and helmet_count == 0:
        status = ComplianceStatus.PARTIAL
        score = 50.0
        message = f"Safety Hazard: {jacket_count} vest(s) detected, but workers are NOT wearing safety helmets!"
        recommendations.append("Halt work immediately and provide safety helmets before resuming operations.")
    else:
        status = ComplianceStatus.NON_COMPLIANT
        score = 0.0
        message = "PPE equipment does not meet construction safety standards."
        recommendations.append("Conduct an immediate physical on-site PPE inspection.")
        
    return ComplianceReport(
        status=status,
        helmet_count=helmet_count,
        jacket_count=jacket_count,
        total_detected=total,
        compliance_score=score,
        message=message,
        recommendations=recommendations
    )

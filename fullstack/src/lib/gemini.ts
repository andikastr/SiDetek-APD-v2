import { GoogleGenAI, Type } from "@google/genai";

export interface RecommendationItem {
  category: string;
  title: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  reference: string;
}

export interface RecommendationData {
  items: RecommendationItem[];
  complianceRate: number;
  totalAudits: number;
  source: "GEMINI_AI" | "RULE_BASED_ENGINE";
  modelUsed?: string;
  generatedAt: string;
}

export interface InspectionMetricsInput {
  totalAudits: number;
  complianceRate: number;
  compliantCount: number;
  partialCount: number;
  violationCount: number;
  totalHelmets: number;
  totalJackets: number;
  avgScore: number;
  recentNotes?: string[];
}

/**
 * Smart Rule-Based Safety Advisory Engine (Fallback if GEMINI_API_KEY is not configured or offline)
 */
export function generateFallbackRecommendations(
  metrics: InspectionMetricsInput
): RecommendationItem[] {
  const {
    totalAudits,
    complianceRate,
    totalHelmets,
    totalJackets,
    violationCount,
  } = metrics;

  const totalPPE = totalHelmets + totalJackets;
  const helmetRatio = totalPPE > 0 ? (totalHelmets / totalPPE) * 100 : 50;
  const jacketRatio = totalPPE > 0 ? (totalJackets / totalPPE) * 100 : 50;

  const recommendations: RecommendationItem[] = [];

  // 1. Primary Risk Card
  if (complianceRate < 75 || violationCount > 0) {
    if (jacketRatio < helmetRatio - 15) {
      recommendations.push({
        category: "CRITICAL HAZARD MITIGATION",
        title: "High-Visibility Vest Enforcement in Active Zones",
        description: `Audit data shows reflective vest adoption (${Math.round(
          jacketRatio
        )}%) lags significantly behind safety helmets (${Math.round(
          helmetRatio
        )}%). Workers near mobile machinery and heavy equipment must wear EN ISO 20471 Class 2/3 high-visibility vests at all times.`,
        severity: "HIGH",
        reference: "EN ISO 20471 / OSHA 1926.201(a)",
      });
    } else if (helmetRatio < jacketRatio - 15) {
      recommendations.push({
        category: "CRITICAL HAZARD MITIGATION",
        title: "Hard Hat Compliance & Head Protection Audit",
        description: `Safety helmet compliance rate is at ${Math.round(
          helmetRatio
        )}%, creating significant overhead impact hazards. Immediate jobsite supervisor intervention and perimeter checkpoint enforcement required.`,
        severity: "HIGH",
        reference: "EN 397:2012 / OSHA 1926.100",
      });
    } else {
      recommendations.push({
        category: "CRITICAL HAZARD MITIGATION",
        title: "Immediate Safety Stand-Down & SOP Re-Briefing",
        description: `Overall compliance is currently at ${complianceRate}% across ${totalAudits} inspections. Conduct a mandatory shift-start safety toolbox briefing before allowing subcontractors to access high-risk excavation and elevated zones.`,
        severity: "HIGH",
        reference: "ISO 45001:2018 Clause 8.1.2",
      });
    }
  } else {
    recommendations.push({
      category: "BENCHMARK EXCELLENCE",
      title: "Sustain Zero-Incident Compliance Performance",
      description: `Jobsite safety compliance is performing strongly at ${complianceRate}% across ${totalAudits} verified audit logs. Maintain automated continuous AI camera surveillance to prevent procedural drift.`,
      severity: "LOW",
      reference: "ISO 45001:2018 Continuous Improvement",
    });
  }

  // 2. Operational Procedure Card
  if (totalAudits > 0 && complianceRate < 90) {
    recommendations.push({
      category: "INSPECTION PROTOCOL",
      title: "Checkpoint Camera Verification at Main Access Gate",
      description:
        "Ensure all entry turnstiles and vehicle gate perimeters execute real-time automated camera scans before worker badge check-in to intercept non-compliant PPE proactively.",
      severity: "MEDIUM",
      reference: "SOP Gate Inspection Protocol K3-02",
    });
  } else {
    recommendations.push({
      category: "PREVENTIVE MAINTENANCE",
      title: "Hard Hat & Shell Structural Integrity Inspection",
      description:
        "Perform bi-weekly physical inspection of helmet shells for UV degradation, micro-fractures, and 4-point harness retention elasticity per manufacturer guidelines.",
      severity: "LOW",
      reference: "EN 397 Equipment Life Cycle Guidance",
    });
  }

  // 3. Regulatory & Continuous Improvement Card
  recommendations.push({
    category: "REGULATORY ACCREDITATION",
    title: "Export Verified Audit Trail for SMK3 / ISO Compliance",
    description:
      "All logged PPE inspection timestamps and image records are securely cataloged in the database, ready for export as formal compliance evidence for external safety auditors.",
    severity: "LOW",
    reference: "Permenaker RI PER.08/MEN/VII/2010",
  });

  return recommendations;
}

/**
 * Generate Actionable K3 Recommendations using Google Gemini LLM
 */
export async function generateGeminiSafetyRecommendations(
  metrics: InspectionMetricsInput
): Promise<RecommendationData> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const generatedAt = new Date().toISOString();

  // If no API key is set, immediately fallback safely to the intelligent rule-based engine
  if (!apiKey) {
    return {
      items: generateFallbackRecommendations(metrics),
      complianceRate: metrics.complianceRate,
      totalAudits: metrics.totalAudits,
      source: "RULE_BASED_ENGINE",
      generatedAt,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

    const prompt = `You are a Senior Certified HSE (Health, Safety, and Environment) Director and K3 Compliance Officer for industrial construction, engineering, and manufacturing sites.
Analyze the following REAL-WORLD PPE inspection telemetry data collected by SiDetek-APD computer vision sensors:

- Total Inspection Sessions: ${metrics.totalAudits}
- Current Safety Compliance Rate: ${metrics.complianceRate}%
- Fully Compliant Sessions: ${metrics.compliantCount}
- Partially Compliant Sessions: ${metrics.partialCount}
- Non-Compliant Violation Sessions: ${metrics.violationCount}
- Detected Safety Helmets: ${metrics.totalHelmets} units
- Detected Reflective Vests: ${metrics.totalJackets} units
- Average Safety Score: ${metrics.avgScore}/100
${
  metrics.recentNotes && metrics.recentNotes.length > 0
    ? `- Recent Inspection Observations: ${metrics.recentNotes.slice(0, 5).join("; ")}`
    : ""
}

Generate EXACTLY 3 highly actionable, professional, and distinct safety recommendation cards tailored specifically to this data in Enterprise English.
Each item must have:
1. "category": A concise uppercase topic (e.g. "CRITICAL HAZARD MITIGATION", "INSPECTION PROTOCOL", "REGULATORY AUDIT", "PREVENTIVE PROCEDURE").
2. "title": An impactful, enterprise-level title.
3. "description": 2-3 concise sentences explaining the specific risk, observed metric discrepancy, and actionable mitigation procedure for supervisors.
4. "severity": One of "HIGH", "MEDIUM", "LOW" based on current risk level.
5. "reference": An official occupational safety standard code (e.g., "ISO 45001:2018 Clause 8.1", "OSHA 1926.100", "EN ISO 20471 Class 2", "EN 397:2012", or "Permenaker PER.08/MEN/VII/2010").`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: {
                    type: Type.STRING,
                    enum: ["HIGH", "MEDIUM", "LOW"],
                  },
                  reference: { type: Type.STRING },
                },
                required: ["category", "title", "description", "severity", "reference"],
              },
            },
          },
          required: ["recommendations"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini API");
    }

    const parsed = JSON.parse(responseText);
    const items: RecommendationItem[] = (parsed.recommendations || []).slice(0, 3);

    if (items.length < 3) {
      throw new Error("Gemini returned fewer than 3 recommendations");
    }

    return {
      items,
      complianceRate: metrics.complianceRate,
      totalAudits: metrics.totalAudits,
      source: "GEMINI_AI",
      modelUsed: modelName,
      generatedAt,
    };
  } catch (error) {
    console.warn("Gemini API call failed or timed out. Falling back to Rule-Based Engine:", error);
    return {
      items: generateFallbackRecommendations(metrics),
      complianceRate: metrics.complianceRate,
      totalAudits: metrics.totalAudits,
      source: "RULE_BASED_ENGINE",
      generatedAt,
    };
  }
}

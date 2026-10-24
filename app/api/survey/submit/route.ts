import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { recordInput } from "@/lib/experiments/may-exp-06/schema";
import crypto from "crypto";

// ============================================================================
// MAY-EXP-06 · Survey Submission Endpoint
// ============================================================================

const surveySubmissionSchema = z.object({
  // Participant data (optional email for anonymous submissions)
  participant: z.object({
    email: z.string().email().optional().nullable(),
    role: z.string().min(1),
    experience_years: z.string(),
    organization_size: z.string(),
    industry_sector: z.string(),
    devsecops_experience: z.string(),
  }),

  // Change data (technical covariates and outcomes)
  change: recordInput.omit({ unit_id: true }).extend({
    unit_id: z.string().optional(), // Optional, auto-generated if not provided
    observations: z.string().optional().nullable(),
    comments: z.string().optional().nullable(),
  }),

  // Location data (country required, city optional)
  location: z.object({
    country: z.string().min(1),
    city: z.string().optional().nullable(),
    timezone: z.string().optional().nullable(),
    coordinates: z
      .object({
        lat: z.number(),
        lon: z.number(),
      })
      .optional()
      .nullable(),
  }),

  // Consent
  consent: z.object({
    accepted: z.literal(true),
    version: z.string().default("1.0"),
  }),

  // Metadata
  language: z.enum(["es", "en"]).default("es"),
});

type SurveySubmission = z.infer<typeof surveySubmissionSchema>;

/** Hash an IP address using SHA-256 (for privacy) */
function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

/** Get client IP from request headers */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Generate a unique change ID */
function generateChangeID(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CHANGE-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const data = surveySubmissionSchema.parse(body);

    // Get client info
    const ip = getClientIP(req);
    const ipHash = hashIP(ip);
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Find or create participant
      let participant;
      
      if (data.participant.email) {
        // Try to find existing participant by email
        const existing = await client.query(
          `SELECT * FROM survey_participants WHERE email = $1`,
          [data.participant.email]
        );
        participant = existing.rows[0];

        if (!participant) {
          // Create new participant with email
          const newParticipant = await client.query(
            `INSERT INTO survey_participants (
              organization_id, email, role, experience_years, organization_size, 
              industry_sector, devsecops_experience, country, city, timezone, 
              coordinates, ip_hash, user_agent, consent_accepted, consent_version, 
              consent_timestamp
            ) VALUES (
              (SELECT id FROM organizations LIMIT 1), -- TODO: Get from session
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()
            ) RETURNING *`,
            [
              data.participant.email,
              data.participant.role,
              data.participant.experience_years,
              data.participant.organization_size,
              data.participant.industry_sector,
              data.participant.devsecops_experience,
              data.location.country,
              data.location.city,
              data.location.timezone,
              data.location.coordinates ? JSON.stringify(data.location.coordinates) : null,
              ipHash,
              userAgent,
              true,
              data.consent.version,
            ]
          );
          participant = newParticipant.rows[0];
        }
      } else {
        // Anonymous participant - create new entry every time
        const newParticipant = await client.query(
          `INSERT INTO survey_participants (
            organization_id, email, role, experience_years, organization_size, 
            industry_sector, devsecops_experience, country, city, timezone, 
            coordinates, ip_hash, user_agent, consent_accepted, consent_version, 
            consent_timestamp
          ) VALUES (
            (SELECT id FROM organizations LIMIT 1),
            NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now()
          ) RETURNING *`,
          [
            data.participant.role,
            data.participant.experience_years,
            data.participant.organization_size,
            data.participant.industry_sector,
            data.participant.devsecops_experience,
            data.location.country,
            data.location.city,
            data.location.timezone,
            data.location.coordinates ? JSON.stringify(data.location.coordinates) : null,
            ipHash,
            userAgent,
            true,
            data.consent.version,
          ]
        );
        participant = newParticipant.rows[0];
      }

      // 2. Create dataset record (technical change data)
      const unitId = data.change.unit_id || generateChangeID();
      const changeData = { ...data.change, unit_id: unitId };

      const datasetRecord = await client.query(
        `INSERT INTO dataset_records (
          organization_id, dataset_id, data, is_valid, data_type
        ) VALUES (
          $1, 
          (SELECT id FROM datasets WHERE organization_id = $1 LIMIT 1),
          $2, 
          true, 
          'REAL'
        ) RETURNING *`,
        [participant.organization_id, JSON.stringify(changeData)]
      );

      // 3. Create survey response (links participant + change data)
      const surveyResponse = await client.query(
        `INSERT INTO survey_responses (
          dataset_record_id, participant_id, organization_id,
          submitted_at, submission_timezone, submission_country, submission_city, 
          submission_coordinates, change_id, ip_hash, user_agent, data_type,
          observations, comments
        ) VALUES (
          $1, $2, $3, now(), $4, $5, $6, $7, $8, $9, $10, 'REAL', $11, $12
        ) RETURNING *`,
        [
          datasetRecord.rows[0].id,
          participant.id,
          participant.organization_id,
          data.location.timezone,
          data.location.country,
          data.location.city,
          data.location.coordinates ? JSON.stringify(data.location.coordinates) : null,
          unitId,
          ipHash,
          userAgent,
          data.change.observations,
          data.change.comments,
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: data.language === 'es' 
          ? '¡Encuesta enviada con éxito! Puedes enviar múltiples cambios con el mismo perfil.'
          : 'Survey submitted successfully! You can submit multiple changes with the same profile.',
        data: {
          participantId: participant.id,
          responseId: surveyResponse.rows[0].id,
          changeId: unitId,
          isNewParticipant: !data.participant.email || participant.submission_count === 0,
          totalSubmissions: participant.submission_count + 1,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }


  } catch (error) {
    console.error("Survey submission error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/daily-logs
 * List daily logs with optional filters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") || "50");

  const supabase = await createClient();

  let query = supabase
    .from("daily_logs")
    .select(`
      *,
      projects (
        id,
        code,
        description,
        client_name
      )
    `)
    .order("log_date", { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  if (startDate) {
    query = query.gte("log_date", startDate);
  }

  if (endDate) {
    query = query.lte("log_date", endDate);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch daily logs", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ dailyLogs: data || [] });
}

/**
 * POST /api/daily-logs
 * Create a new daily log
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      logDate,
      workSummary,
      areasWorked,
      weather,
      weatherImpact,
      temperatureHigh,
      temperatureLow,
      notes,
      internalNotes,
      safetyMeetingHeld,
      incidentsReported,
      incidentDetails,
      source = "web",
      crew = [],
    } = body;

    if (!projectId || !logDate) {
      return NextResponse.json(
        { error: "projectId and logDate are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create the daily log
    const { data: dailyLog, error: logError } = await supabase
      .from("daily_logs")
      .upsert(
        {
          project_id: projectId,
          log_date: logDate,
          work_summary: workSummary,
          areas_worked: areasWorked,
          weather,
          weather_impact: weatherImpact,
          temperature_high: temperatureHigh,
          temperature_low: temperatureLow,
          notes,
          internal_notes: internalNotes,
          safety_meeting_held: safetyMeetingHeld,
          incidents_reported: incidentsReported,
          incident_details: incidentDetails,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id,log_date" }
      )
      .select()
      .single();

    if (logError) {
      return NextResponse.json(
        { error: "Failed to create daily log", details: logError.message },
        { status: 500 }
      );
    }

    // If crew data provided, add them
    if (crew.length > 0 && dailyLog) {
      // First delete existing crew for this log
      await supabase
        .from("daily_log_crew")
        .delete()
        .eq("daily_log_id", dailyLog.id);

      // Insert new crew
      const crewInserts = crew.map((c: {
        workerName: string;
        workerType?: string;
        company?: string;
        hoursWorked: number;
        startTime?: string;
        endTime?: string;
        role?: string;
        taskDescription?: string;
        notes?: string;
      }) => ({
        daily_log_id: dailyLog.id,
        worker_name: c.workerName,
        worker_type: c.workerType,
        company: c.company,
        hours_worked: c.hoursWorked,
        start_time: c.startTime,
        end_time: c.endTime,
        role: c.role,
        task_description: c.taskDescription,
        notes: c.notes,
      }));

      const { error: crewError } = await supabase
        .from("daily_log_crew")
        .insert(crewInserts);

      if (crewError) {
        console.error("Failed to insert crew:", crewError);
      }
    }

    return NextResponse.json({ dailyLog, success: true });
  } catch (error) {
    console.error("Error creating daily log:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

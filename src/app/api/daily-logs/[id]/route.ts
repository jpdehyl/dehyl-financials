import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/daily-logs/[id]
 * Get a single daily log with all related data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Get the daily log
  const { data: dailyLog, error: logError } = await supabase
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
    .eq("id", id)
    .single();

  if (logError) {
    return NextResponse.json(
      { error: "Daily log not found", details: logError.message },
      { status: 404 }
    );
  }

  // Get crew
  const { data: crew } = await supabase
    .from("daily_log_crew")
    .select("*")
    .eq("daily_log_id", id)
    .order("created_at");

  // Get materials
  const { data: materials } = await supabase
    .from("daily_log_materials")
    .select("*")
    .eq("daily_log_id", id)
    .order("created_at");

  // Get equipment
  const { data: equipment } = await supabase
    .from("daily_log_equipment")
    .select("*")
    .eq("daily_log_id", id)
    .order("created_at");

  // Get visitors
  const { data: visitors } = await supabase
    .from("daily_log_visitors")
    .select("*")
    .eq("daily_log_id", id)
    .order("created_at");

  return NextResponse.json({
    dailyLog: {
      ...dailyLog,
      crew: crew || [],
      materials: materials || [],
      equipment: equipment || [],
      visitors: visitors || [],
    },
  });
}

/**
 * PUT /api/daily-logs/[id]
 * Update a daily log
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case for update
    const fieldMap: Record<string, string> = {
      workSummary: "work_summary",
      areasWorked: "areas_worked",
      weather: "weather",
      weatherImpact: "weather_impact",
      temperatureHigh: "temperature_high",
      temperatureLow: "temperature_low",
      notes: "notes",
      internalNotes: "internal_notes",
      safetyMeetingHeld: "safety_meeting_held",
      incidentsReported: "incidents_reported",
      incidentDetails: "incident_details",
      status: "status",
    };

    Object.entries(fieldMap).forEach(([camel, snake]) => {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    });

    // Update status timestamps
    if (body.status === "submitted" && !body.submittedAt) {
      updateData.submitted_at = new Date().toISOString();
    }
    if (body.status === "approved" && !body.approvedAt) {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = body.approvedBy || "admin";
    }

    const { data, error } = await supabase
      .from("daily_logs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update daily log", details: error.message },
        { status: 500 }
      );
    }

    // Update crew if provided
    if (body.crew && Array.isArray(body.crew)) {
      await supabase.from("daily_log_crew").delete().eq("daily_log_id", id);

      if (body.crew.length > 0) {
        const crewInserts = body.crew.map((c: {
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
          daily_log_id: id,
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

        await supabase.from("daily_log_crew").insert(crewInserts);
      }
    }

    return NextResponse.json({ dailyLog: data, success: true });
  } catch (error) {
    console.error("Error updating daily log:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/daily-logs/[id]
 * Delete a daily log
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete daily log", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

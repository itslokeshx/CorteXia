import cron from "node-cron";

/**
 * Service to handle cron jobs
 */
export const startCronJobs = () => {
    // Schedule a task to run every 14 minutes
    cron.schedule("*/14 * * * *", async () => {
        try {
            const backendUrl =
                process.env.RENDER_EXTERNAL_URL ||
                "https://cortexia-backend.onrender.com";
            const healthEndpoint = `${backendUrl}/api/health`;

            console.log(`[Keep-Alive] Pinging backend: ${healthEndpoint}`);

            const response = await fetch(healthEndpoint);

            if (response.ok) {
                console.log(`[Keep-Alive] Success: ${response.status}`);
            } else {
                console.error(
                    `[Keep-Alive] Failed to ping backend: ${response.status} ${response.statusText}`,
                );
            }
        } catch (error) {
            console.error("[Keep-Alive] Error pinging backend:", error);
        }
    });

    console.log("⏰ Cron jobs scheduled");
};

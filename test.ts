import { handler } from ".";

const url = "http://localhost:3000";

const result = await handler.fetch(
    new Request(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            Resource: "minio:*",
            Action: "GetObject",
            Context: {
                remoteIP: "192.168.1.100",
                purpose: "backup",
            },
            UserId: "811122ad-27a1-48a1-9151-75739cd89019",
        }),
    })
);

console.log("Authorization result:", await result.text());
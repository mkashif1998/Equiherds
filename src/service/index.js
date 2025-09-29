
const baseUrl = "http://localhost:3000";

const getToken = () => {
    const token = localStorage.getItem("token");
    return token;
};

export const getRequest = async (url) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        }
    });
    const data = await response.json();
    return data;
}

export const postRequest = async (url, data) => {
    const authToken = getToken();
    console.log("postRequest - URL:", url); // Debug log
    console.log("postRequest - Data:", JSON.stringify(data, null, 2)); // Debug log
    console.log("postRequest - Stringified body:", JSON.stringify(data)); // Debug log
    const response = await fetch(`${baseUrl}${url}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return responseData;
}

export const putRequest = async (url, data) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    const responseData = await response.json();
    return responseData;
}

export const deleteRequest = async (url) => {
    const authToken = getToken();
    const response = await fetch(`${baseUrl}${url}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        },
    });
    if (response.status === 204) {
        return { ok: true };
    }
    // Some APIs respond with empty body but 200
    const text = await response.text();
    try {
        return text ? JSON.parse(text) : { ok: response.ok };
    } catch (_) {
        return { ok: response.ok };
    }
}


// Upload a single file to the external documents-upload API and return the first URL string
export const uploadFile = async (file) => {
    if (!file) {
        throw new Error("No file provided");
    }

    const formData = new FormData();
    // Most document upload APIs accept 'files' for multiple; this will work for single too
    formData.append('files', file);

    const response = await fetch('https://lms-api.wiserbee.ca/api/Document/documents-upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    // Expected response: ["https://.../file.png"]
    if (Array.isArray(result) && result.length > 0 && typeof result[0] === 'string') {
        return result[0];
    }

    throw new Error("Unexpected upload response");
}

// Upload multiple files in a single request and return an array of URLs
export const uploadFiles = async (files) => {
    const fileArray = Array.from(files || []).filter(Boolean);
    if (fileArray.length === 0) {
        throw new Error("No files provided");
    }

    const formData = new FormData();
    for (const f of fileArray) {
        formData.append('files', f);
    }

    const response = await fetch('https://lms-api.wiserbee.ca/api/Document/documents-upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    // Expected response: ["https://.../file1.png", "https://.../file2.png"]
    if (Array.isArray(result) && result.every((u) => typeof u === 'string')) {
        return result;
    }
    throw new Error("Unexpected upload response");
}


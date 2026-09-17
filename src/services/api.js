const API_URL = "https://script.google.com/macros/s/AKfycbw3-b781_EiXjAvJBsU6Knh5y_S4ABuaiLW2U0nKEolAm-y8YQ2m6qtafm-wHviIDAa/exec";

export async function loginStudent(studentNo, pin) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
            studentNo: studentNo,
            pin: pin
        })
    });

    const data = await response.json();

    return data;
}
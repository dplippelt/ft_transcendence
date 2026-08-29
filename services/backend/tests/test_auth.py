def test_login_with_valid_credentials(client, user, user_credentials):
    # Arrange
    # Fixture already created the test user and credentials

    # Act
    response = client.post(
        "/auth/login",
        json={
            "email": user_credentials["email"],
            "password": user_credentials["password"],
        },
    )

    # Assest
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

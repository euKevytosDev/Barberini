package br.com.barberini.security;

public class UsuarioPrincipal {
    private final Long id;
    private final String email;
    private final String papel;

    public UsuarioPrincipal(Long id, String email, String papel) {
        this.id = id;
        this.email = email;
        this.papel = papel;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPapel() { return papel; }

    public boolean isDono() {
        return "DONO".equalsIgnoreCase(papel);
    }
}

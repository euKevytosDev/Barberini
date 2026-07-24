package br.com.barberini.security;

import lombok.Getter;

@Getter
public class UsuarioPrincipal {
    private final Long id;
    private final String email;
    private final String papel;

    public UsuarioPrincipal(Long id, String email, String papel) {
        this.id = id;
        this.email = email;
        this.papel = papel;
    }

    public boolean isDono() {
        return "DONO".equalsIgnoreCase(papel);
    }
}

package br.com.barberini.security;

import br.com.barberini.model.Papel;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

public final class AuthSupport {
    private AuthSupport() {}

    public static UsuarioPrincipal atual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UsuarioPrincipal p)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Faça login para continuar");
        }
        return p;
    }

    public static void exigirDono() {
        if (!atual().isDono()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o dono pode fazer isso");
        }
    }

    public static boolean isDono(Papel papel) {
        return papel == Papel.DONO;
    }
}

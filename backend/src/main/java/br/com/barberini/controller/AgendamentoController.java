package br.com.barberini.controller;

import br.com.barberini.dto.CriarAgendamentoRequest;
import br.com.barberini.service.AgendamentoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    /** Sync com o servidor — só na confirmação do agendamento */
    @PostMapping
    public Map<String, Object> criar(@Valid @RequestBody CriarAgendamentoRequest request) {
        return service.criar(request);
    }

    @GetMapping("/meus")
    public List<Map<String, Object>> meus() {
        return service.meus();
    }

    @DeleteMapping("/{id}")
    public Map<String, String> cancelar(@PathVariable Long id) {
        service.cancelar(id);
        return Map.of("message", "Agendamento cancelado");
    }
}

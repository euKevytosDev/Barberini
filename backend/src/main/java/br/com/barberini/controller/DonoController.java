package br.com.barberini.controller;

import br.com.barberini.dto.BarbeiroRequest;
import br.com.barberini.dto.BloqueioRequest;
import br.com.barberini.dto.ServicoRequest;
import br.com.barberini.service.AgendamentoService;
import br.com.barberini.service.CatalogoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dono")
public class DonoController {

    private final CatalogoService catalogo;
    private final AgendamentoService agendamentos;

    public DonoController(CatalogoService catalogo, AgendamentoService agendamentos) {
        this.catalogo = catalogo;
        this.agendamentos = agendamentos;
    }

    @GetMapping("/agendamentos")
    public List<Map<String, Object>> agenda(@RequestParam(defaultValue = "30") int dias) {
        return agendamentos.todosProximos(dias);
    }

    @GetMapping("/barbeiros")
    public List<Map<String, Object>> barbeiros() {
        return catalogo.listarBarbeiros(false);
    }

    @PostMapping("/barbeiros")
    public Map<String, Object> criarBarbeiro(@Valid @RequestBody BarbeiroRequest req) {
        return catalogo.criarBarbeiro(req);
    }

    @PutMapping("/barbeiros/{id}")
    public Map<String, Object> atualizarBarbeiro(@PathVariable Long id, @Valid @RequestBody BarbeiroRequest req) {
        return catalogo.atualizarBarbeiro(id, req);
    }

    @GetMapping("/servicos")
    public List<Map<String, Object>> servicos() {
        return catalogo.listarServicos(false);
    }

    @PostMapping("/servicos")
    public Map<String, Object> criarServico(@Valid @RequestBody ServicoRequest req) {
        return catalogo.criarServico(req);
    }

    @PutMapping("/servicos/{id}")
    public Map<String, Object> atualizarServico(@PathVariable Long id, @Valid @RequestBody ServicoRequest req) {
        return catalogo.atualizarServico(id, req);
    }

    @GetMapping("/bloqueios")
    public List<Map<String, Object>> bloqueios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return catalogo.listarBloqueios(data);
    }

    @PostMapping("/bloqueios")
    public Map<String, Object> criarBloqueio(@Valid @RequestBody BloqueioRequest req) {
        return catalogo.criarBloqueio(req);
    }

    @DeleteMapping("/bloqueios/{id}")
    public Map<String, String> removerBloqueio(@PathVariable Long id) {
        catalogo.removerBloqueio(id);
        return Map.of("message", "Horário reativado");
    }
}

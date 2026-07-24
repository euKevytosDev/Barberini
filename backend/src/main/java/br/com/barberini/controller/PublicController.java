package br.com.barberini.controller;

import br.com.barberini.repository.ServicoRepository;
import br.com.barberini.service.AgendaService;
import br.com.barberini.service.CatalogoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final CatalogoService catalogo;
    private final AgendaService agenda;
    private final ServicoRepository servicos;

    public PublicController(CatalogoService catalogo, AgendaService agenda, ServicoRepository servicos) {
        this.catalogo = catalogo;
        this.agenda = agenda;
        this.servicos = servicos;
    }

    @GetMapping("/barbeiros")
    public List<Map<String, Object>> barbeiros() {
        return catalogo.listarBarbeiros(true);
    }

    @GetMapping("/servicos")
    public List<Map<String, Object>> servicos() {
        return catalogo.listarServicos(true);
    }

    @GetMapping("/slots")
    public Map<String, Object> slots(
            @RequestParam Long barbeiroId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) Long servicoId,
            @RequestParam(required = false, defaultValue = "30") Integer duracaoMin) {
        int dur = duracaoMin;
        if (servicoId != null) {
            dur = servicos.findById(servicoId).map(s -> s.getDuracaoMin()).orElse(dur);
        }
        return Map.of(
                "barbeiroId", barbeiroId,
                "data", data.toString(),
                "duracaoMin", dur,
                "slots", agenda.slotsDisponiveis(barbeiroId, data, dur)
        );
    }

    @GetMapping("/bloqueios")
    public List<Map<String, Object>> bloqueios(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return catalogo.listarBloqueios(data);
    }
}
